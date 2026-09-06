# 限制验证码请求次数
import time
from fastapi import HTTPException, Request

_calls: dict[str, list[float]] = {}   # {IP: [请求时间戳, 时间戳, ...]}
LIMIT = 5                              # 最多 5 次
WINDOW_SECONDS = 60                    # 每 60 秒

# 请求限流
def request_rate_limit(request: Request,count: int = LIMIT, window: int = WINDOW_SECONDS):
    ip = request.client.host                          # 从请求元信息拿到来源 IP
    now = time.time()

    # 获取该ip时间窗口内的请求次数
    recent = [t for t in _calls.get(ip, []) if now - t < window]

    # 如果请求次数超过限制，抛出异常
    if len(recent) >= count:
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后再试")

    # 记录当前次数的请求
    recent.append(now)        
    # 更新到calls中
    _calls[ip] = recent