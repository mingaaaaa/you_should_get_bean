# 统一响应信封
from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """统一成功响应：{"code": 200, "message": "...", "data": {...}}"""
    code: int = 200
    message: str = "success"
    data: T | None = None


def ok(data: T | None = None, message: str = "success") -> ApiResponse[T]:
    """成功响应的快捷构造：ok(data=...) 带数据，ok(message="注册成功") 只带文案"""
    return ApiResponse(code=200, message=message, data=data)
