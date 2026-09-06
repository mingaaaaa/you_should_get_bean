# 身份校验路由
from fastapi import APIRouter, Depends, HTTPException  
from app.schemas import auth as auth_schema
from app.core import captcha, security
from app.core.rate_limit import request_rate_limit
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.api.deps import get_db
from app.models.user import User
from argon2 import PasswordHasher
from app.core.error_codes import DECRYPT_FAILED

# 创建路由器对象
# 路由前缀是auth， 标签方便文档进行分类
router = APIRouter(prefix="/auth", tags=["auth"])


# 获取验证码接口
@router.get(
  '/captcha', # 路径  /auth/captcha
  summary="获取验证码", # 摘要
  response_model=auth_schema.CaptchaSchemaResponse, # 响应模型
  # 依赖可以放在单独的路由，也可以放在APIRouter路由组，还可以直接放在应用级别app = FastAPI(dependencies=[Depends(全站日志)])
  dependencies=[Depends(request_rate_limit)], # 依赖 因为只需要request_rate_limit做校验，所以放在这里
  responses={429: {"description": "请求过于频繁"}}, # /docs 默认只展示 200（和 422），加这段后 429 也出现在文档里
)
# 如果接口函数要使用依赖，就不能放在装饰器的 dependencies 里，而是作为方法形参传入：def get_captcha(limit = Depends(request_rate_limit))，然后在函数里用 limit:
def get_captcha():
    """生成验证码信息并返回"""
    return captcha.generate() # 返回id和图片的base64编码


# 获取公钥的接口
@router.get(
  '/public_key', # 路径  /auth/public_key
  summary="获取公钥", # 摘要
  response_model=auth_schema.PublicKeySchemaResponse, # 响应模型
  dependencies=[Depends(request_rate_limit)], # 依赖 因为只需要request_rate_limit做校验，所以放在这里
  responses={429: {"description": "请求过于频繁"}}, # /docs 默认只展示 200（和 422），加这段后 429 也出现在文档里
)
def get_public_key():
    """返回公钥"""
    return {"public_key": security.get_public_key()} # 返回PEM格式的RSA公钥


# 注册接口
@router.post(
  '/register', # 路径  /auth/register
  summary="注册新用户", # 摘要
  response_model=auth_schema.RegisterSchemaResponse, # 响应模型
)
def register(data: auth_schema.RegisterSchemaRequest,db:Session = Depends(get_db)):
    """注册新用户"""
    # 校验验证码是否正确
    if not captcha.captcha_verify(data.captcha_id, data.captcha_code):
      raise HTTPException(status_code=400, detail="验证码错误或已过期")
    user = User(username=data.username, email=data.email, password_hash=data.password)
    # 私钥解密得到密码文本
    try:
      password = security.decrypt_password(data.password)
    except Exception:
      raise HTTPException(status_code=400, detail={
        "code": DECRYPT_FAILED,
        "message": "密码解密失败",
    })
    # 将解密的密码进行hash处理
    ph = PasswordHasher()
    user.password_hash = ph.hash(password)
    try:
        db.add(user)
        db.commit()
        db.refresh(user)  # 重新 SELECT，拿回数据库生成的 id、created_at
        return auth_schema.RegisterSchemaResponse(message="注册成功")
    except IntegrityError:
        db.rollback() # 回滚事务，避免后续操作报错
        raise HTTPException(status_code=400, detail="注册失败，用户名或邮箱已存在")
    