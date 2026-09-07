// 统一请求封装：60s 超时；按信封判定——成功 = HTTP 200 + {code: 200, message, data}，resolve 出 data 字段；
// 失败 = 非 2xx + {code, message}（code 优先业务码如 4001，没有则等于 HTTP 状态码），一律 reject ApiError
// 登录态：本地存有 token 时自动带上 Authorization 头；收到登录态失效码时自动清理并跳登录页
import { ErrCode } from "./api";
import { tokenStore } from "./token";

const TIMEOUT_MS = 60_000;

// 这些业务码意味着本地登录态已不可用（对齐 backend/app/core/error_codes.py）
const SESSION_DEAD_CODES: readonly number[] = [
  ErrCode.TOKEN_MISS,
  ErrCode.TOKEN_INVALID,
  ErrCode.TOKEN_EXPIRED,
  ErrCode.USER_DISABLED,
];

export class ApiError extends Error {
  /** HTTP 状态码；0 表示请求没到达服务器（断网、超时、后端没开） */
  readonly status: number;
  /** 后端业务码：失败信封必带（业务码或 HTTP 状态码），只有网络层错误（status=0）时才没有 */
  readonly code?: number;

  constructor(status: number, message: string, code?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export type RequestOptions = Omit<RequestInit, 'signal'> & {
  /** 传了自动 JSON.stringify 并补 Content-Type，省去调用处手写 */
  params?: unknown;
  timeout?: number; // 单个接口的超时时间
  signal?: AbortSignal; // 外部手动终止
};

export async function request<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
  const { params, timeout = TIMEOUT_MS, signal, ...init } = options;
  // 默认有一个超时的signal
  const signals: AbortSignal[] = [AbortSignal.timeout(timeout)];
  // 如果手动传了signal
  if (signal) signals.push(signal);
  let res: Response;
  // 本地有 token 就自动带上，登录后的接口调用处不用手写请求头
  const token = tokenStore.get();
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(params !== undefined ? { "Content-Type": "application/json" } : {}),
        ...init.headers, // 调用处传的 headers 永远能覆盖默认值
      },
      ...(params !== undefined ? { body: JSON.stringify(params) } : {}),
      // 任意一个 signal 触发就 abort
      signal: AbortSignal.any(signals),
    });
  } catch {
    // fetch 只在网络失败/超时时 reject，此时没有响应体，统一归为 status=0、message 为空
    throw new ApiError(0, '');
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
      window.location.href = "/login";
    }
    throw new ApiError(res.status, data?.message ?? '', data?.code);
  }
  // 成功时 resolve 信封里的 data 字段（最终结果）
  return data.data as T;
}
