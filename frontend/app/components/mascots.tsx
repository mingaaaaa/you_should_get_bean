// 蜜糖小熊主题的共享 SVG 组件与表单样式（登录页/注册页共用）

export function HoneyBear({ happy }: { happy: boolean }) {
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

export function Bee({ className }: { className?: string }) {
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

export function Paw({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <ellipse cx="20" cy="26" rx="10" ry="8" fill="currentColor" />
      <circle cx="9" cy="15" r="4" fill="currentColor" />
      <circle cx="20" cy="11" r="4" fill="currentColor" />
      <circle cx="31" cy="15" r="4" fill="currentColor" />
    </svg>
  );
}

export function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-honey-deep"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M4 20 c0 -4 4 -6 8 -6 s8 2 8 6 Z" fill="currentColor" />
    </svg>
  );
}

export function MailIcon() {
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

export function LockIcon() {
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

export function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-honey-deep"
      aria-hidden="true"
    >
      <path
        d="M12 2 l8 3 v6 c0 5 -3.5 9 -8 11 c-4.5 -2 -8 -6 -8 -11 V5 Z"
        fill="currentColor"
      />
      <path
        d="M8.5 12 l2.5 2.5 l4.5 -4.5"
        fill="none"
        stroke="#fff6e5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 蜜糖风格输入框基础样式；hasError 控制错误描边，额外类名（如密码框的 pr-12）由调用方追加
export function honeyInputClass(hasError: boolean, extra = "") {
  return `w-full rounded-2xl border-2 bg-cream/60 py-3 pl-11 pr-4 text-cocoa placeholder:text-cocoa-light/60 outline-none transition-all focus:border-honey focus:bg-white focus:ring-4 focus:ring-honey/20 ${
    hasError ? "border-[#e8795a]" : "border-honey/30"
  } ${extra}`;
}
