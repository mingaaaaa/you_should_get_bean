// 公钥缓存：公钥接口有限流（5 次/60 秒/IP），且公钥只在后端手动重新生成密钥对时才会变，
// 所以用 localStorage 缓存 + 24h 保质期 + 单飞去重，正常使用一个浏览器最多一天请求一次
import { API } from "./api";
import { request } from "./request";

const STORAGE_KEY = "auth:public_key";
const TTL_MS = 24 * 60 * 60 * 1000;

type CachedKey = { key: string; fetchedAt: number };

function readCache(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Partial<CachedKey>;
    if (typeof c.key !== "string" || typeof c.fetchedAt !== "number") return null;
    return Date.now() - c.fetchedAt <= TTL_MS ? c.key : null;
  } catch {
    // localStorage 被禁用或缓存内容被改坏：当作没有缓存，走网络
    return null;
  }
}

function writeCache(key: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ key, fetchedAt: Date.now() }));
  } catch {
    // 写不进去（隐私模式等）不影响本次使用，只是下次还得请求
  }
}

// 单飞：请求在途时把 Promise 存在这里，并发的调用者直接等它，不再发新请求
let inflight: Promise<string | null> | null = null;

// 返回 null 表示没拿到（后端没开、网络异常、被限流），调用方决定怎么提示
export function getPublicKey(): Promise<string | null> {
  const cached = readCache();
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    // 非 200 / 网络异常 / 超时都会 reject，统一 catch 成 null，语义与返回值注释一致
    inflight = request<{ public_key: string }>(API.public_key, { cache: "no-store" })
      .then((data) => {
        const key = typeof data?.public_key === "string" ? data.public_key : null;
        if (key) writeCache(key);
        return key;
      })
      .catch(() => null)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

// 后端轮换密钥对后，拿到解密失败错误时调用它清缓存，下次 getPublicKey 会拉新的
export function clearPublicKey() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 清不掉也不影响，写入时会整体覆盖
  }
}
