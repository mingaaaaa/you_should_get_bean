// 登录令牌（JWT）的存取：登录成功后 set，退出/失效后 clear
// request.ts 每次请求前 get 出来塞进 Authorization 头，业务代码不用关心细节
const TOKEN_KEY = "auth:token"; // 和公钥缓存 auth:public_key 同一命名风格

export const tokenStore = {
  get(): string | null {
    // SSR（服务端渲染）没有 localStorage，直接当作未登录
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  },
};
