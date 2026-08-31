"use client";

import { useState, type FormEvent } from "react";
import { ZCOOL_KuaiLe } from "next/font/google";

const kuaile = ZCOOL_KuaiLe({
  weight: "400",
  subsets: ["chinese-simplified"],
  preload: false,
});

type Status = "idle" | "loading" | "success";

function HoneyBear({ happy }: { happy: boolean }) {
  return (
    <svg
      viewBox="0 0 220 200"
      className="h-36 w-40 drop-shadow-[0_10px_16px_rgba(247,179,43,0.35)]"
      role="img"
      aria-label="蜜糖小熊"
    >
      {/* 耳朵 */}
      <circle cx="56" cy="52" r="30" fill="#d9a066" />
      <circle cx="56" cy="52" r="17" fill="#c4885a" />
      <circle cx="164" cy="52" r="30" fill="#d9a066" />
      <circle cx="164" cy="52" r="17" fill="#c4885a" />
      {/* 头 */}
      <ellipse cx="110" cy="115" rx="78" ry="70" fill="#d9a066" />
      {/* 头顶蜂蜜 */}
      <path
        d="M88 46 q10 -20 30 -14 q22 -8 30 12 q10 10 -2 18 q-10 6 -20 0 q-8 10 -20 4 q-12 4 -16 -8 q-6 -6 -2 -12 Z"
        fill="#f7b32b"
      />
      <path d="M142 56 q7 12 0 20 q-5 7 -11 1 q-5 -7 1 -17 Z" fill="#f7b32b" />
      <ellipse cx="108" cy="42" rx="8" ry="4" fill="#ffd97a" opacity="0.9" />
      {/* 眼睛（开心眯眯眼） */}
      <path
        d="M64 106 q9 -12 18 0"
        stroke="#6b4226"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M138 106 q9 -12 18 0"
        stroke="#6b4226"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* 腮红 */}
      <ellipse cx="58" cy="126" rx="13" ry="9" fill="#ffb3ba" opacity="0.8" />
      <ellipse cx="162" cy="126" rx="13" ry="9" fill="#ffb3ba" opacity="0.8" />
      {/* 口鼻 */}
      <ellipse cx="110" cy="138" rx="40" ry="30" fill="#f9ead0" />
      <ellipse cx="110" cy="127" rx="12" ry="8" fill="#6b4226" />
      <path
        d="M110 135 v8"
        stroke="#6b4226"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {happy ? (
        <path
          d="M92 146 q18 24 36 0 q-6 20 -18 20 q-12 0 -18 -20 Z"
          fill="#8c5a33"
        />
      ) : (
        <path
          d="M96 146 q7 9 14 0 q7 9 14 0"
          stroke="#6b4226"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {happy && (
        <g fill="#ff8fa3">
          <path d="M24 30 c-4 -6 -12 -3 -10 3 c1 4 6 7 10 9 c4 -2 9 -5 10 -9 c2 -6 -6 -9 -10 -3 Z" />
          <path d="M196 66 c-4 -6 -12 -3 -10 3 c1 4 6 7 10 9 c4 -2 9 -5 10 -9 c2 -6 -6 -9 -10 -3 Z" />
        </g>
      )}
    </svg>
  );
}

function Bee({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 50" className={className} aria-hidden="true">
      <ellipse cx="26" cy="14" rx="10" ry="8" fill="#ffffff" opacity="0.85" />
      <ellipse cx="36" cy="12" rx="9" ry="7" fill="#ffffff" opacity="0.7" />
      <ellipse cx="30" cy="30" rx="17" ry="12" fill="#f7b32b" />
      <ellipse cx="25" cy="30" rx="3.5" ry="10" fill="#6b4226" />
      <ellipse cx="35" cy="30" rx="3.5" ry="10" fill="#6b4226" />
      <path d="M13 30 l-7 3 l7 4 Z" fill="#6b4226" />
      <circle cx="40" cy="27" r="1.8" fill="#6b4226" />
    </svg>
  );
}

function Paw({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <ellipse cx="20" cy="26" rx="10" ry="8" fill="currentColor" />
      <circle cx="9" cy="15" r="4" fill="currentColor" />
      <circle cx="20" cy="11" r="4" fill="currentColor" />
      <circle cx="31" cy="15" r="4" fill="currentColor" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-honey-deep"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M4 8 l8 6 l8 -6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-honey-deep"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="10" rx="3" fill="currentColor" />
      <path
        d="M8 10 V7 a4 4 0 0 1 8 0 v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [status, setStatus] = useState<Status>("idle");

  function validate() {
    const e: { email?: string; password?: string } = {};
    if (!email.trim()) {
      e.email = "小熊说：先告诉小熊你的邮箱吧 🍯";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = "小熊说：这个邮箱看起来怪怪的～";
    }
    if (!password) {
      e.password = "小熊说：蜂蜜密码不能为空哦 🍯";
    } else if (password.length < 6) {
      e.password = "小熊说：蜂蜜密码至少要 6 位哦 🍯";
    }
    return e;
  }

  async function handleSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (status === "loading") return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setStatus("loading");
    // TODO: 接入后端登录接口后，把下面的模拟请求替换为
    // await fetch("/api/login", { method: "POST", body: JSON.stringify({ email, password }) })
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus("success");
  }

  const inputClass = (hasError: boolean) =>
    `w-full rounded-2xl border-2 bg-cream/60 py-3 pl-11 pr-4 text-cocoa placeholder:text-cocoa-light/60 outline-none transition-all focus:border-honey focus:bg-white focus:ring-4 focus:ring-honey/20 ${
      hasError ? "border-[#e8795a]" : "border-honey/30"
    }`;

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

      {/* 登录卡片 */}
      <section className="relative w-full max-w-md rounded-[2.5rem] border-2 border-honey/25 bg-white/90 px-8 pb-9 pt-7 shadow-[0_20px_50px_-12px_rgba(221,148,16,0.35)] backdrop-blur">
        <div className="flex flex-col items-center">
          <div className="animate-wiggle">
            <HoneyBear happy={status === "success"} />
          </div>
          <h1 className={`mt-1 text-4xl text-cocoa ${kuaile.className}`}>
            蜜糖小熊
          </h1>
          <p className="mt-1 text-sm text-cocoa-light">
            欢迎回到蜂巢，小熊想你了 🍯
          </p>
        </div>

        {status === "success" && (
          <div className="mt-5 rounded-2xl border-2 border-honey/40 bg-honey/15 px-4 py-3 text-center text-cocoa">
            🍯 登录成功！小熊这就带你去蜂巢～
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block pl-1 text-sm font-medium text-cocoa">
              邮箱
            </label>
            <div className="relative">
              <MailIcon />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="bear@honey.com"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                aria-invalid={!!errors.email}
                className={inputClass(!!errors.email)}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 pl-1 text-sm text-[#d1543b]">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block pl-1 text-sm font-medium text-cocoa">
              蜂蜜密码
            </label>
            <div className="relative">
              <LockIcon />
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                placeholder="至少 6 位哦"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                aria-invalid={!!errors.password}
                className={`${inputClass(!!errors.password)} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "隐藏密码" : "显示密码"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-cocoa-light transition hover:bg-cream hover:text-cocoa"
              >
                {showPwd ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                      d="M3 3 l18 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M10.5 5.2 A11 11 0 0 1 12 5 c5 0 9 4.5 10 7 c-.5 1.2 -1.5 2.7 -3 4 M6.7 6.9 C4.6 8.4 2.9 10.6 2 12 c1 2.5 5 7 10 7 c1.4 0 2.7 -.3 3.9 -.9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M9.9 9.9 a3 3 0 1 0 4.2 4.2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                      d="M2 12 c1 -2.5 5 -7 10 -7 s9 4.5 10 7 c-1 2.5 -5 7 -10 7 s-9 -4.5 -10 -7 Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 pl-1 text-sm text-[#d1543b]">{errors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-between pl-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-cocoa">
              <input
                type="checkbox"
                checked={remember}
                onChange={(ev) => setRemember(ev.target.checked)}
                className="size-4 accent-honey"
              />
              记住这罐蜂蜜
            </label>
            <a href="#" className="text-sm text-honey-deep underline-offset-4 hover:underline">
              忘记密码？
            </a>
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className={`mt-1 w-full rounded-full bg-honey py-3.5 text-lg text-white shadow-[0_8px_20px_-6px_rgba(221,148,16,0.6)] transition-all hover:-translate-y-0.5 hover:bg-honey-deep hover:shadow-[0_12px_24px_-6px_rgba(221,148,16,0.7)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 ${kuaile.className}`}
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-1.5">
                酿蜜中
                <span className="animate-bounce [animation-delay:0ms]">·</span>
                <span className="animate-bounce [animation-delay:150ms]">·</span>
                <span className="animate-bounce [animation-delay:300ms]">·</span>
              </span>
            ) : (
              "进入蜂巢 🍯"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-cocoa-light">
          还没有蜂巢？
          <a
            href="#"
            className={`ml-1 text-honey-deep underline-offset-4 hover:underline ${kuaile.className}`}
          >
            去注册一个
          </a>
        </p>
      </section>
    </main>
  );
}
