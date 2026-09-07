// 接口路径统一在这里维护，将来某个接口升 v2 时只改这一行
export const API = {
  captcha: "/api/v1/auth/captcha",
  public_key: "/api/v1/auth/public_key",
  register: "/api/v1/auth/register",
  login: "/api/v1/auth/login",
  me: "/api/v1/auth/me",
} as const;

// 业务错误码，与 backend/app/core/error_codes.py 对齐
export const ErrCode = {
  DECRYPT_FAILED: 4001, // RSA 私钥解密失败（通常是前端缓存了旧公钥）
  TOKEN_MISS: 401, // 没带 token
  TOKEN_INVALID: 402, // token 无效（签名不对/被篡改）
  TOKEN_EXPIRED: 403, // token 过期
  USER_DISABLED: 410, // 用户不存在或已被禁用
} as const;
