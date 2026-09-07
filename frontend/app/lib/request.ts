// 统一请求封装：60s 超时；按信封判定——成功 = HTTP 200 + {code: 200, message, data}，resolve 出 data 字段；
// 失败 = 非 2xx + {code, message}（code 优先业务码如 4001，没有则等于 HTTP 状态码），一律 reject ApiError
const TIMEOUT_MS = 60_000;

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
  try {
    res = await fetch(url, {
      ...init,
      // 如果要改请求头等，必须通过 params 传入
      ...(params !== undefined && {
        headers: { 'Content-Type': 'application/json', ...init.headers },
        body: JSON.stringify(params),
      }),
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
    throw new ApiError(res.status, data?.message ?? '', data?.code);
  }
  // 成功时 resolve 信封里的 data 字段（最终结果）
  return data.data as T;
}
