from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.responses import JSONResponse
from app.api.routes import auth

# 创建fastapi实例
app = FastAPI()

# 注册全局异常处理器，处理所有 HTTPException 异常
@app.exception_handler(HTTPException)
# HTTPException——fastapi.HTTPException 是子类，starlette.exceptions.HTTPException 是父类
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """所有失败响应统一成 {code, message}：detail 里带业务码就透传（如 4001），没有就用 HTTP 状态码"""
    # 如果传的是包含code和message的dict
    if isinstance(exc.detail, dict):
        content = {
            "code": exc.detail.get("code", exc.status_code),
            "message": exc.detail.get("message", ""),
        }
    else:
        # 如果只给了错误信息字符串，就用 HTTP 状态码作为 code
        content = {"code": exc.status_code, "message": str(exc.detail)}
    return JSONResponse(
        status_code=exc.status_code,
        content=content,
        headers=exc.headers,  # 如果异常带了附加响应头（比如 429 的 Retry-After），不丢
    )

# 422 参数校验失败走的是 RequestValidationError，不是 HTTPException，
# 不接管的话响应体是 FastAPI 默认的 {"detail": [...]}，会破坏统一信封
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """参数校验失败也统一成 {code, message}"""
    return JSONResponse(
        status_code=422,
        content={"code": 422, "message": "参数校验失败"},
    )

# 挂载路由器（版本前缀统一在这里加，路由自身只保留 /auth 业务前缀；
# 将来重构出 v2 时，再 include 一次新路由并挂 /api/v2 即可，v1 不动）
app.include_router(auth.router, prefix="/api/v1")
