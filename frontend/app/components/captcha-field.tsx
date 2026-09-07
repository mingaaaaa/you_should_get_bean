"use client";

// 图形验证码字段（登录页/注册页共用）
// 封装：拉取验证码、点击换图（3 秒冷却）、加载失败提示；
// 输入框本身是受控组件，值和校验错误由页面管理
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import { ShieldIcon, honeyInputClass } from "./mascots";
import { API } from "../lib/api";
import { request, ApiError } from "../lib/request";

const CAPTCHA_COOLDOWN_MS = 3000;

// 后端返回的验证码数据：id + base64 图片
export type CaptchaData = { captcha_id: string; image: string };

// 暴露给页面的操作句柄
export type CaptchaFieldHandle = {
  // 强制换一张（不受点击冷却限制），并清空输入框
  // 验证码是一次性的，提交被后端拒绝后必须换新图才能重试
  refresh: () => void;
};

type CaptchaFieldProps = {
  // 输入框 id，配合页面里 <label htmlFor> 使用
  id: string;
  // 验证码输入值（受控）
  value: string;
  // 输入变化回调（组件内已做"只留数字、最多 4 位"过滤）
  onChange: (code: string) => void;
  // 页面 validate() 产出的校验错误文案
  error?: string;
  // 每次加载后同步给页面（提交时要用 captcha_id），加载失败时为 null
  onLoad?: (captcha: CaptchaData | null) => void;
  // React 19 起 ref 可以像普通 prop 一样声明，不再需要 forwardRef
  ref?: Ref<CaptchaFieldHandle>;
};

export function CaptchaField({ id, value, onChange, error, onLoad, ref }: CaptchaFieldProps) {
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [captchaMsg, setCaptchaMsg] = useState<string | null>(null);
  const [cooling, setCooling] = useState(false);

  const lastCaptchaAt = useRef(0);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 页面传的回调每次渲染都是新闭包，用 ref 存最新一份，
  // 这样 loadCaptcha 保持稳定引用，挂载 effect 不会因回调变化而重复拉取
  const onChangeRef = useRef(onChange);
  const onLoadRef = useRef(onLoad);
  // ref 不能在渲染期间写，放到 effect 里同步
  useEffect(() => {
    onChangeRef.current = onChange;
    onLoadRef.current = onLoad;
  });

  // 加载验证码
  const loadCaptcha = useCallback(async () => {
    try {
      const data = await request<CaptchaData>(API.captcha, { cache: "no-store" });
      setCaptcha(data);
      setCaptchaMsg(null);
      onLoadRef.current?.(data);
    } catch (err) {
      if (err instanceof ApiError && err.status !== 0) {
        // 后端拒绝（如限流），有 message 用原文，没有走通用兜底
        setCaptchaMsg(err.message || "小熊拿不到验证码，稍后再试 🍯");
      } else {
        // status=0：网络异常或超时
        setCaptchaMsg("小熊连不上蜂巢服务器，看看后端开了吗 🍯");
      }
      onLoadRef.current?.(null);
    }
    lastCaptchaAt.current = Date.now();
    setCooling(true);
    if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    cooldownTimer.current = setTimeout(() => setCooling(false), CAPTCHA_COOLDOWN_MS);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      refresh() {
        // 换了新图，旧输入必然作废
        onChangeRef.current("");
        loadCaptcha();
      },
    }),
    [loadCaptcha],
  );

  useEffect(() => {
    // 挂载时拉取第一张验证码；所有 setState 都在 await fetch 之后的异步回调里，
    // 该规则无法跨 await 分析，误报为同步 setState
    /* eslint-disable react-hooks/set-state-in-effect */
    loadCaptcha();
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, [loadCaptcha]);

  function handleCaptchaClick() {
    if (Date.now() - lastCaptchaAt.current < CAPTCHA_COOLDOWN_MS) return;
    loadCaptcha();
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block pl-1 text-sm font-medium text-cocoa">
        验证码
      </label>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <ShieldIcon />
          <input
            id={id}
            type="text"
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            placeholder="4 位数字"
            value={value}
            onChange={(ev) => onChange(ev.target.value.replace(/\D/g, "").slice(0, 4))}
            aria-invalid={!!error}
            className={honeyInputClass(!!error)}
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
      {error && (
        <p className="mt-1.5 pl-1 text-sm text-[#d1543b]">{error}</p>
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
  );
}
