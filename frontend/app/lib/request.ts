// 统一请求封装：60s 超时；按信封判定——成功 = HTTP 200 + {code: 200, message, data}，resolve 出 data 字段；
// 失败 = 非 2xx + {code, message}（code 优先业务码如 4001，没有则等于 HTTP 状态码），一律 reject ApiError
// 传参统一走 params：GET/HEAD/DELETE 序列化成查询串，其余序列化成 JSON body（见 formatParams）
// 登录态：本地存有 token 时自动带上 Authorization 头；收到登录态失效码时自动清理并跳登录页
import { ErrCode } from './api';
import { tokenStore } from './token';

const TIMEOUT_MS = 60_000;

// 这些业务码意味着本地登录态已不可用（对齐 backend/app/core/error_codes.py）
const SESSION_DEAD_CODES: readonly number[] = [
  ErrCode.TOKEN_MISS,
  ErrCode.TOKEN_INVALID,
  ErrCode.TOKEN_EXPIRED,
  ErrCode.USER_DISABLED,
];

// status=0（请求没到服务器）时的细分原因
export type NetworkKind = 'network' | 'timeout' | 'aborted';

export class ApiError extends Error {
  /** HTTP 状态码；0 表示请求没到达服务器（断网、超时、被取消），此时看 kind 细分 */
  readonly status: number;
  /** 后端业务码：失败信封必带（业务码或 HTTP 状态码），只有网络层错误（status=0）时才没有 */
  readonly code?: number;
  /** 仅 status=0 时有值：network=断网/后端没开；timeout=超时；aborted=调用方主动取消（不是故障，静默忽略即可） */
  readonly kind?: NetworkKind;

  constructor(status: number, message: string, code?: number, kind?: NetworkKind) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.kind = kind;
  }
}

// 无请求体的方法：params 序列化成查询串拼进 URL
// （GET/HEAD 带 body 是 fetch 的硬性报错；DELETE 按惯例也走查询串，不少代理会丢弃 DELETE 的 body）
const BODYLESS_METHODS = new Set(['GET', 'HEAD', 'DELETE']);

// 查询串场景下 params 的取值范围（JSON body 场景不受此限，整体仍是 Record<string, unknown>）
type QueryParams = Record<
  string,
  string | number | boolean | null | undefined | (string | number | boolean)[]
>;

// 统一序列化传参：调用处无论发什么请求都只管传 params——
// GET/HEAD/DELETE → 拼成 ?a=1&b=2 追加到 url；POST/PUT/PATCH → JSON.stringify 成请求体。
// params 不传则原样返回，调用处也可以只给 url 不带任何参数（如 auth/captcha）
export function formatParams(
  url: string,
  method: string | undefined,
  params: unknown,
): { url: string; body?: string } {
  // 如果没有params直接返回url
  if (params === undefined) return { url };
  // 处理没有body的请求类型(就是处理params拼接到URL上)
  if (BODYLESS_METHODS.has((method ?? 'GET').toUpperCase())) {
    const qs = new URLSearchParams(); // 自带 URL 编码，中文/特殊字符不会乱
    for (const [key, value] of Object.entries(params as QueryParams)) {
      // null/undefined 的键直接丢弃——查询串里 null 表示"不筛这个条件"；
      // 注意 JSON body 场景相反：null 会原样保留（register 的 email: null 就是这么用的）
      if (value === null || value === undefined) continue;
      // 数组值重复键名：ids: [1, 2] → ids=1&ids=2
      if (Array.isArray(value)) value.forEach((v) => qs.append(key, String(v)));
      else qs.append(key, String(value));
    }
    // url 可能已手动拼了部分查询串，按有无 ? 决定接 & 还是 ?
    const joiner = url.includes('?') ? '&' : '?';
    return { url: `${url}${joiner}${qs}` };
  }
  // 可以使用body的请求直接序列化参数返回
  return { url, body: JSON.stringify(params) };
}

export type RequestOptions = Omit<RequestInit, 'signal'> & {
  /** 统一传参：GET/HEAD/DELETE 序列化成查询串，其余 JSON.stringify 成请求体并补 Content-Type */
  params?: unknown;
  timeout?: number; // 单个接口的超时时间
  signal?: AbortSignal; // 外部手动终止
};

export async function request<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
  const { params, timeout = TIMEOUT_MS, signal, ...init } = options;
  // 默认有一个超时的signal（单独留引用，catch 里靠它区分"超时"和"断网"）
  const timeoutSignal = AbortSignal.timeout(timeout);
  const signals: AbortSignal[] = [timeoutSignal];
  // 如果手动传了signal
  if (signal) signals.push(signal);
  let res: Response;
  // 先统一序列化传参：得到最终请求的 url 和可能的 JSON body
  const { url: finalUrl, body } = formatParams(url, init.method, params);
  const hasBody = body !== undefined;
  // 本地有 token 就自动带上，登录后的接口调用处不用手写请求头
  const token = tokenStore.get();
  const headers = {
    // Content-Type 只在真的有 JSON body 时补：无 body 的 GET 不该声明内容类型；
    // FormData 上传（调用处直接传 init.body）必须留给浏览器生成带 boundary 的头，写死就废了
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}), // 自动携带token
    ...init.headers, // 如果用户有上传的headers直接覆盖
  };
  try {
    res = await fetch(finalUrl, {
      ...init,
      headers,
      ...(hasBody ? { body } : {}),
      // 任意一个 signal 触发就 abort
      signal: AbortSignal.any(signals),
    });
  } catch {
    // fetch 只在网络层失败时 reject（没有响应体可解析），status 一律为 0，按 kind 细分原因
    if (signal?.aborted) {
      // 外部 signal 触发 = 调用方主动取消（切换筛选条件砍掉旧请求、组件卸载清理），
      // 不是故障，调用处应静默忽略，不要给用户报错
      throw new ApiError(0, '', undefined, 'aborted');
    }
    if (timeoutSignal.aborted) {
      // 内部超时信号触发 = 请求超时
      throw new ApiError(0, '', undefined, 'timeout');
    }
    // 两个 signal 都没触发 = fetch 自身失败：断网、DNS 解析失败、后端没开
    throw new ApiError(0, '', undefined, 'network');
  }
  // data 可能为 null（响应体不是合法 JSON），后面取字段都要用 ?.
  const data = await res.json().catch(() => null);
  // 信封判定：HTTP 200 且业务码 200 才算成功，否则抛出状态码、错误信息以及错误码
  if (res.status !== 200 || data?.code !== 200) {
    // 登录态失效（没带/无效/过期 token、用户被禁用）：集中清掉本地 token 并回登录页，
    // 各调用处不用重复处理；照常抛出 ApiError，调用处的 catch 逻辑依旧生效
    if (data?.code !== undefined && SESSION_DEAD_CODES.includes(data.code)) {
      tokenStore.clear();
      // 这里是普通模块（不在 React 上下文），拿不到 useRouter().push；
      // 且登录态失效后正好需要整页刷新来重置所有页面状态，硬跳转是想要的效果
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/login';
    }
    throw new ApiError(res.status, data?.message ?? '', data?.code);
  }
  // 成功时 resolve 信封里的 data 字段（最终结果）
  return data.data as T;
}
