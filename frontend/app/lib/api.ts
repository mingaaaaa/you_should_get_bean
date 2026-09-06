// 接口路径统一在这里维护，将来某个接口升 v2 时只改这一行
export const API = {
  captcha: "/api/v1/auth/captcha",
  public_key: "/api/v1/auth/public_key",
  register: "/api/v1/auth/register",
} as const;
