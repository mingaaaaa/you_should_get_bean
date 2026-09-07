# 公共依赖：多个接口都要用的"入场检查/资源借还"
# （get_db：借还数据库会话；以后的 get_current_user：验登录态
from app.core import database, security, error_codes
import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends, HTTPException
from app.models.user import User
from sqlalchemy import select

def get_db():
    """获取数据库会话的依赖"""
    db = database.SessionLocal() # 借出数据库会话
    try:
        yield db # 交给接口函数使用
    finally:
        db.close() # 归还数据库会话

bearer = HTTPBearer(auto_error=False)  # 从 Authorization: Bearer <token> 头里提取 token
# 校验token
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db = Depends(get_db),
) -> User:
    # 如果没有token
    if credentials is None:
        raise HTTPException(status_code=error_codes.TOKEN_MISS, detail="未登录")
    try:
        user_id = security.verify_jwt_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=error_codes.TOKEN_EXPIRED, detail="登录已过期，请重新登录")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=error_codes.TOKEN_INVALID, detail="无效的登录凭证")
     # token 有效，再查一次库确认用户还存在、没被禁用(可选的，纯jwt是没有这个时效性的)
    user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status_code=error_codes.USER_DISABLED, detail="用户不存在或已被禁用")
    return user
