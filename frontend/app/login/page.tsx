"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HoneyBear,
  Bee,
  Paw,
  UserIcon,
  LockIcon,
  honeyInputClass,
} from "../components/mascots";
import {
  CaptchaField,
  type CaptchaFieldHandle,
} from "../components/captcha-field";
import { kuaile } from "../fonts";
import { API, ErrCode } from "../lib/api";
import { request, ApiError } from "../lib/request";
import { encryptPassword } from "../lib/crypto";
import { getPublicKey, clearPublicKey } from "../lib/publicKey";
import { tokenStore } from "../lib/token";

type Status = "idle" | "loading" | "success";

export default function LoginPage() {
  // 登录标识：用户名或邮箱，一个输入框二选一，后端按是否含 @ 区分
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [captchaCode, setCaptchaCode] = useState("");
  const [errors, setErrors] = useState<{
    account?: string;
    password?: string;
    captchaCode?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const router = useRouter();
  // 当前验证码的 id（CaptchaField 每次加载后同步过来），提交时要带 captcha_id；
  // 换图时 refresh 会清空输入，这里的 id 也会跟着更新
  const captchaIdRef = useRef("");
  const captchaRef = useRef<CaptchaFieldHandle>(null);

  useEffect(() => {
    // 验证码的拉取/刷新都移进了 CaptchaField，挂载时它会自己加载第一张；
    // 页面只负责预热公钥：有 localStorage 缓存时是纯本地读取，没缓存时提前拉一次，提交时不用等
    getPublicKey();
  }, []);

  function validate() {
    const e: { account?: string; password?: string; captchaCode?: string } = {};
    const name = account.trim();
    if (!name) {
      e.account = "小熊说：先告诉小熊你的名字或邮箱吧 🍯";
    } else if (name.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(name)) {
      // 带 @ 才按邮箱格式校验，不带 @ 就当作用户名，长度合法性交给后端判断
      e.account = "小熊说：这个邮箱看起来怪怪的～";
    }
    if (!password) {
      e.password = "小熊说：蜂蜜密码不能为空哦 🍯";
    } else if (password.length < 6) {
      e.password = "小熊说：蜂蜜密码至少要 6 位哦 🍯";
    }
    if (!captchaCode) {
      e.captchaCode = "小熊说：把图里的 4 位数字告诉小熊哦 🍯";
    } else if (!/^\d{4}$/.test(captchaCode)) {
      e.captchaCode = "小熊说：验证码是 4 位数字哦 🍯";
    }
    return e;
  }

  async function handleSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    // 成功后的 1 秒展示窗口里也不允许重复提交
    if (status !== "idle") return;
    const e = validate();
    setErrors(e);
    setServerError(null);
    if (Object.keys(e).length > 0) return;

    setStatus("loading");
    // 提交前拿公钥：优先命中 localStorage 缓存，没有时模块内部会拉取并自动去重
    const key = await getPublicKey();
    if (!key) {
      setServerError("小熊没拿到加密公钥，稍后再试试 🍯");
      setStatus("idle");
      return;
    }
    const cipher = encryptPassword(key, password);
    if (!cipher) {
      setServerError("密码加密失败了，稍后再试试 🍯");
      setStatus("idle");
      return;
    }
    try {
      // 成功时信封 data 里是后端签发的 JWT
      const { token } = await request<{ token: string }>(API.login, {
        method: "POST",
        params: {
          // 用户名或邮箱，后端按是否含 @ 决定查 username 还是 email 字段
          account: account.trim(),
          // 传 RSA 加密后的 base64 密文，不传明文
          password: cipher,
          captcha_id: captchaIdRef.current,
          captcha_code: captchaCode,
        },
      });
      // 存好 token，之后 request 会自动带上 Authorization 头
      tokenStore.set(token);
      setStatus("success");
      // 让"登录成功"的提示先露个脸，再带用户回蜂巢（首页）
      setTimeout(() => router.push("/"), 1000);
      return;
    } catch (err) {
      if (!(err instanceof ApiError) || err.status === 0) {
        // status=0：网络异常或超时，请求没到后端，验证码还没被消费，不用换图
        setServerError("小熊连不上蜂巢服务器，看看后端开了吗 🍯");
      } else {
        const msg = err.message || "登录失败，小熊也不知道为什么 🍯";
        // 公钥过期（后端轮换过密钥对）：清掉 localStorage 缓存，下次提交会自动拉新公钥
        if (err.code === ErrCode.DECRYPT_FAILED) {
          clearPublicKey();
        }
        setServerError(msg);
        // 登录接口第一步就校验并消费验证码：只要请求到了后端（无论失败原因），
        // 这张验证码都作废了，必须换一张才能重试；refresh 会清空输入框并换新图
        captchaRef.current?.refresh();
      }
    }
    setStatus("idle");
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

        {serverError && (
          <div className="mt-5 rounded-2xl border-2 border-[#e8795a]/50 bg-[#e8795a]/10 px-4 py-3 text-center text-sm text-[#d1543b]">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-5">
          <div>
            <label htmlFor="account" className="mb-1.5 block pl-1 text-sm font-medium text-cocoa">
              用户名 / 邮箱
            </label>
            <div className="relative">
              <UserIcon />
              <input
                id="account"
                type="text"
                autoComplete="username"
                placeholder="bear 或 bear@honey.com"
                value={account}
                onChange={(ev) => setAccount(ev.target.value)}
                aria-invalid={!!errors.account}
                className={honeyInputClass(!!errors.account)}
              />
            </div>
            {errors.account && (
              <p className="mt-1.5 pl-1 text-sm text-[#d1543b]">{errors.account}</p>
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
                className={honeyInputClass(!!errors.password, "pr-12")}
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

          <CaptchaField
            id="login-captcha"
            value={captchaCode}
            onChange={setCaptchaCode}
            error={errors.captchaCode}
            onLoad={(captcha) => (captchaIdRef.current = captcha?.captcha_id ?? "")}
            ref={captchaRef}
          />

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
          <Link
            href="/register"
            className={`ml-1 text-honey-deep underline-offset-4 hover:underline ${kuaile.className}`}
          >
            去注册一个
          </Link>
        </p>
      </section>
    </main>
  );
}
