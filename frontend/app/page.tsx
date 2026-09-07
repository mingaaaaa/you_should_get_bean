"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HoneyBear, Bee, Paw } from "./components/mascots";
import { kuaile } from "./fonts";
import { API } from "./lib/api";
import { request } from "./lib/request";
import { tokenStore } from "./lib/token";

// /auth/me 返回的当前用户信息（只声明用得到的字段）
type Me = { id: number; username: string; email: string | null };

export default function Home() {
  // null = 未登录（或登录态无效），确认期间用 loading 区分开"未登录"和"还没查完"
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 本地没存 token 就是未登录，不用发请求；
      // 有 token 才调受保护的 /me：拿到用户信息说明登录态有效
      // （token 过期/无效由 request.ts 集中处理——清 token + 跳登录页，这里不用重复管）
      if (tokenStore.get()) {
        try {
          const data = await request<Me>(API.me);
          if (!cancelled) setMe(data);
        } catch {
          // 网络失败等：当作未登录展示，不打断页面
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function logout() {
    tokenStore.clear();
    setMe(null);
  }

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_15%,#ffe9bf_0%,transparent_45%),radial-gradient(circle_at_85%_85%,#ffe0a3_0%,transparent_45%),linear-gradient(160deg,#fff6e5_0%,#ffefce_100%)] px-4 py-10">
      {/* 背景装饰：小爪印和蜂蜜光斑 */}
      <Paw className="absolute left-[8%] top-[18%] h-10 w-10 -rotate-12 text-bear/25" />
      <Paw className="absolute left-[15%] top-[70%] h-8 w-8 rotate-12 text-bear/20" />
      <Paw className="absolute right-[10%] top-[24%] h-9 w-9 rotate-45 text-bear/20" />
      <Paw className="absolute right-[18%] bottom-[12%] h-10 w-10 -rotate-6 text-bear/25" />
      <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-honey/15 blur-3xl" />
      <div className="absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-honey/20 blur-3xl" />
      <Bee className="absolute left-[12%] top-[30%] hidden h-10 w-12 animate-float md:block" />
      <Bee className="absolute right-[14%] top-[52%] hidden h-8 w-10 animate-float-slow md:block" />
      <Bee className="absolute bottom-[20%] left-[22%] hidden h-7 w-9 animate-float md:block [animation-delay:1.2s]" />

      {/* 蜂巢卡片 */}
      <section className="relative w-full max-w-md rounded-[2.5rem] border-2 border-honey/25 bg-white/90 px-8 pb-9 pt-7 text-center shadow-[0_20px_50px_-12px_rgba(221,148,16,0.35)] backdrop-blur">
        <div className="flex flex-col items-center">
          <div className="animate-wiggle">
            <HoneyBear happy={!!me} />
          </div>
          <h1 className={`mt-1 text-4xl text-cocoa ${kuaile.className}`}>蜂巢</h1>

          {loading ? (
            <p className="mt-2 text-sm text-cocoa-light">
              小熊正在确认你的蜂巢…
            </p>
          ) : me ? (
            <>
              <p className="mt-2 text-lg text-cocoa">
                🍯 欢迎回来，<span className={kuaile.className}>{me.username}</span>！
              </p>
              {me.email && (
                <p className="mt-1 text-sm text-cocoa-light">{me.email}</p>
              )}
              <button
                type="button"
                onClick={logout}
                className={`mt-6 w-full rounded-full border-2 border-honey/40 bg-white py-3 text-base text-cocoa transition-all hover:-translate-y-0.5 hover:border-honey hover:bg-honey/10 active:scale-95 ${kuaile.className}`}
              >
                退出登录
              </button>
            </>
          ) : (
            <>
              <p className="mt-2 text-lg text-cocoa-light">
                你还没进入蜂巢哦～
              </p>
              <Link
                href="/login"
                className={`mt-6 block w-full rounded-full bg-honey py-3.5 text-lg text-white shadow-[0_8px_20px_-6px_rgba(221,148,16,0.6)] transition-all hover:-translate-y-0.5 hover:bg-honey-deep hover:shadow-[0_12px_24px_-6px_rgba(221,148,16,0.7)] active:scale-95 ${kuaile.className}`}
              >
                去登录 🍯
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
