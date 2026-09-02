from fastapi import FastAPI, HTTPException, Request
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.responses import JSONResponse
from app.api.routes import auth

# 创建fastapi实例
app = FastAPI()

# 注册全局异常处理器，处理所有 HTTPException 异常
@app.exception_handler(HTTPException)
# HTTPException——fastapi.HTTPException 是子类，starlette.exceptions.HTTPException 是父类
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """把所有 HTTPException 的响应体从 {"detail": ...} 改成 {"message": ...}"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail},
        headers=exc.headers,  # 如果异常带了附加响应头（比如 429 的 Retry-After），不丢
    )

# 挂载路由器（版本前缀统一在这里加，路由自身只保留 /auth 业务前缀；
# 将来重构出 v2 时，再 include 一次新路由并挂 /api/v2 即可，v1 不动）
app.include_router(auth.router, prefix="/api/v1")
