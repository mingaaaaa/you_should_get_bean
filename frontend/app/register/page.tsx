"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  HoneyBear,
  Bee,
  Paw,
  UserIcon,
  MailIcon,
  LockIcon,
  ShieldIcon,
  honeyInputClass,
} from "../components/mascots";
import { kuaile } from "../fonts";
import { API } from "../lib/api";
import { encryptPassword } from "../lib/crypto";
import { getPublicKey } from "../lib/publicKey";

const CAPTCHA_COOLDOWN_MS = 3000;

type Status = "idle" | "loading" | "success";
type Captcha = { captcha_id: string; image: string };

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [captchaMsg, setCaptchaMsg] = useState<string | null>(null);
  const [cooling, setCooling] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    email?: string;
    captchaCode?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  const lastCaptchaAt = useRef(0);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 加载验证码
  async function loadCaptcha() {
    try {
      const res = await fetch(API.captcha, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setCaptchaMsg(data?.message ?? "小熊拿不到验证码，稍后再试 🍯");
      } else {
        setCaptcha(data);
        setCaptchaMsg(null);
      }
    } catch {
      setCaptchaMsg("小熊连不上蜂巢服务器，看看后端开了吗 🍯");
    }
    lastCaptchaAt.current = Date.now();
    setCooling(true);
    if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    cooldownTimer.current = setTimeout(() => setCooling(false), CAPTCHA_COOLDOWN_MS);
  }

  useEffect(() => {
    // 挂载时拉取第一张验证码和公钥；所有 setState 都在 await fetch 之后的异步回调里，
    // 该规则无法跨 await 分析，误报为同步 setState
    /* eslint-disable react-hooks/set-state-in-effect */
    loadCaptcha();
    // 预热公钥：有 localStorage 缓存时是纯本地读取，没缓存时提前拉一次，提交时不用等
    getPublicKey();
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, []);

  function handleCaptchaClick() {
    if (Date.now() - lastCaptchaAt.current < CAPTCHA_COOLDOWN_MS) return;
    loadCaptcha();
  }

  // 校验
  function validate() {
    const e: typeof errors = {};
    const name = username.trim();
    if (!name) {
      e.username = "小熊说：先给自己起个名字吧 🍯";
    } else if (name.length < 2 || name.length > 20) {
      e.username = "小熊说：名字要 2~20 个字哦 🍯";
    }
    if (!password) {
      e.password = "小熊说：蜂蜜密码不能为空哦 🍯";
    } else if (password.length < 6) {
      e.password = "小熊说：蜂蜜密码至少要 6 位哦 🍯";
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = "小熊说：这个邮箱看起来怪怪的～";
    }
    if (!captchaCode) {
      e.captchaCode = "小熊说：把图里的 4 位数字告诉小熊哦 🍯";
    } else if (!/^\d{4}$/.test(captchaCode)) {
      e.captchaCode = "小熊说：验证码是 4 位数字哦 🍯";
    }
    return e;
  }

  // 提交注册
  async function handleSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (status === "loading") return;
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
      const res = await fetch(API.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          // 空邮箱传 null：后端 email 是 EmailStr | None，收到 null/空串/缺省都会归一成 None
          email: email.trim() || null,
          // 传 RSA 加密后的 base64 密文，不传明文
          password: cipher,
          captcha_id: captcha?.captcha_id ?? "",
          captcha_code: captchaCode,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setStatus("success");
        return;
      }
      const msg = data?.message ?? "注册失败，小熊也不知道为什么 🍯";
      setServerError(msg);
      if (msg.includes("验证码")) {
        // 验证码是一次性的，校验后（无论对错）已作废，必须换一张
        setCaptchaCode("");
        loadCaptcha();
      }
    } catch {
      setServerError("小熊连不上蜂巢服务器，看看后端开了吗 🍯");
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

      {/* 注册卡片 */}
      <section className="relative w-full max-w-md rounded-[2.5rem] border-2 border-honey/25 bg-white/90 px-8 pb-9 pt-7 shadow-[0_20px_50px_-12px_rgba(221,148,16,0.35)] backdrop-blur">
        <div className="flex flex-col items-center">
          <div className="animate-wiggle">
            <HoneyBear happy={status === "success"} />
          </div>
          <h1 className={`mt-1 text-4xl text-cocoa ${kuaile.className}`}>
            加入蜂巢
          </h1>
          <p className="mt-1 text-sm text-cocoa-light">
            和蜜糖小熊一起酿甜甜的蜜吧 🍯
          </p>
        </div>

        {status === "success" ? (
          <div className="mt-6 flex flex-col items-center gap-5">
            <div className="w-full rounded-2xl border-2 border-honey/40 bg-honey/15 px-4 py-3 text-center text-cocoa">
              🍯 注册成功！蜂巢的大门为你打开啦～
            </div>
            <Link
              href="/login"
              className={`w-full rounded-full bg-honey py-3.5 text-center text-lg text-white shadow-[0_8px_20px_-6px_rgba(221,148,16,0.6)] transition-all hover:-translate-y-0.5 hover:bg-honey-deep active:scale-95 ${kuaile.className}`}
            >
              去登录 🍯
            </Link>
          </div>
        ) : (
          <>
            {serverError && (
              <div className="mt-5 rounded-2xl border-2 border-[#e8795a]/50 bg-[#e8795a]/10 px-4 py-3 text-center text-sm text-[#d1543b]">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-5">
              <div>
                <label htmlFor="username" className="mb-1.5 block pl-1 text-sm font-medium text-cocoa">
                  用户名
                </label>
                <div className="relative">
                  <UserIcon />
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="2~20 个字"
                    value={username}
                    onChange={(ev) => setUsername(ev.target.value)}
                    aria-invalid={!!errors.username}
                    className={honeyInputClass(!!errors.username)}
                  />
                </div>
                {errors.username && (
                  <p className="mt-1.5 pl-1 text-sm text-[#d1543b]">{errors.username}</p>
                )}
              </div>

              <div>
                <label htmlFor="reg-email" className="mb-1.5 block pl-1 text-sm font-medium text-cocoa">
                  邮箱 <span className="text-cocoa-light/70">（可不填）</span>
                </label>
                <div className="relative">
                  <MailIcon />
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    placeholder="bear@honey.com"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    aria-invalid={!!errors.email}
                    className={honeyInputClass(!!errors.email)}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 pl-1 text-sm text-[#d1543b]">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="reg-password" className="mb-1.5 block pl-1 text-sm font-medium text-cocoa">
                  蜂蜜密码
                </label>
                <div className="relative">
                  <LockIcon />
                  <input
                    id="reg-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="至少 6 位哦"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    aria-invalid={!!errors.password}
                    className={honeyInputClass(!!errors.password)}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1.5 pl-1 text-sm text-[#d1543b]">{errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="captcha" className="mb-1.5 block pl-1 text-sm font-medium text-cocoa">
                  验证码
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <ShieldIcon />
                    <input
                      id="captcha"
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      autoComplete="off"
                      placeholder="4 位数字"
                      value={captchaCode}
                      onChange={(ev) =>
                        setCaptchaCode(ev.target.value.replace(/\D/g, "").slice(0, 4))
                      }
                      aria-invalid={!!errors.captchaCode}
                      className={honeyInputClass(!!errors.captchaCode)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCaptchaClick}
                    title={cooling ? "小蜜蜂搬运中，稍等一下就能换" : "看不清？点击换一张"}
                    aria-label="点击刷新验证码"
                    className={`relative shrink-0 overflow-hidden rounded-xl border-2 border-honey/30 bg-cream transition ${
                      cooling ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-honey active:scale-95"
                    }`}
                    style={{ width: 120, height: 40 }}
                  >
                    {captcha ? (
                      // eslint-disable-next-line @next/next/no-img-element -- data URL 动态图片，不适合走 next/image
                      <img
                        src={captcha.image}
                        alt="验证码"
                        width={120}
                        height={40}
                        className="block"
                        draggable={false}
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs text-cocoa-light">
                        加载中…
                      </span>
                    )}
                  </button>
                </div>
                {errors.captchaCode && (
                  <p className="mt-1.5 pl-1 text-sm text-[#d1543b]">{errors.captchaCode}</p>
                )}
                {captchaMsg && (
                  <p className="mt-1.5 pl-1 text-sm text-[#d1543b]">{captchaMsg}</p>
                )}
                {cooling && !captchaMsg && (
                  <p className="mt-1.5 pl-1 text-xs text-cocoa-light/80">
                    小蜜蜂搬运中，稍等一下就能换一张
                  </p>
                )}
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
                  "加入蜂巢 🍯"
                )}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-cocoa-light">
          已经有蜂巢了？
          <Link
            href="/login"
            className={`ml-1 text-honey-deep underline-offset-4 hover:underline ${kuaile.className}`}
          >
            返回登录
          </Link>
        </p>
      </section>
    </main>
  );
}
