# 身份校验路由
from fastapi import APIRouter, Depends, HTTPException  
from app.schemas import auth as auth_schema
from app.schemas import common
from app.core import captcha, security
from app.core.rate_limit import request_rate_limit
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.api.deps import get_db, get_current_user
from app.models.user import User
from argon2 import PasswordHasher, exceptions 
from app.core.error_codes import DECRYPT_FAILED
from sqlalchemy import select, or_

# 创建路由器对象
# 路由前缀是auth， 标签方便文档进行分类
router = APIRouter(prefix="/auth", tags=["auth"])


# 获取验证码接口
@router.get(
  '/captcha', # 路径  /auth/captcha
  summary="获取验证码", # 摘要
  response_model=common.ApiResponse[auth_schema.CaptchaSchemaResponse], # 响应模型（信封套数据模型，/docs 里能看到嵌套结构）
  # 依赖可以放在单独的路由，也可以放在APIRouter路由组，还可以直接放在应用级别app = FastAPI(dependencies=Depends(全站日志))
  dependencies=[Depends(request_rate_limit)], # 依赖 因为只需要request_rate_limit做校验，所以放在这里
  responses={429: {"description": "请求过于频繁"}}, # /docs 默认只展示 200（和 422），加这段后 429 也出现在文档里
)
# 如果接口函数要使用依赖，就不能放在装饰器的 dependencies 里，而是作为方法形参传入：def get_captcha(limit = Depends(request_rate_limit))，然后在函数里用 limit:
def get_captcha():
    """生成验证码信息并返回"""
    return common.ok(captcha.generate()) # 信封包住id和图片的base64编码


# 获取公钥的接口
@router.get(
  '/public_key', # 路径  /auth/public_key
  summary="获取公钥", # 摘要
  response_model=common.ApiResponse[auth_schema.PublicKeySchemaResponse], # 响应模型（信封）
  dependencies=[Depends(request_rate_limit)], # 依赖 因为只需要request_rate_limit做校验，所以放在这里
  responses={429: {"description": "请求过于频繁"}}, # /docs 默认只展示 200（和 422），加这段后 429 也出现在文档里
)
def get_public_key():
    """返回公钥"""
    return common.ok({"public_key": security.get_public_key()}) # 信封包住PEM格式的RSA公钥


# 注册接口
@router.post(
  '/register', # 路径  /auth/register
  summary="注册新用户", # 摘要
  response_model=common.ApiResponse, # common.ok其实已经返回了正确的结构，这里是为了统一以及/docs里能看到嵌套结构吗，还有就是加了一层保险
)
def register(data: auth_schema.RegisterSchemaRequest, db:Session = Depends(get_db)):
    """注册新用户"""
    # 校验验证码是否正确
    if not captcha.captcha_verify(data.captcha_id, data.captcha_code):
      raise HTTPException(status_code=400, detail="验证码错误或已过期")
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
    user = User(username=data.username, email=data.email, password_hash=ph.hash(password))
    try:
        db.add(user)
        db.commit()
        db.refresh(user)  # 重新 SELECT，拿回数据库生成的 id、created_at
        return common.ok(message="注册成功")
    except IntegrityError:
        db.rollback() # 回滚事务，避免后续操作报错
        raise HTTPException(status_code=400, detail="注册失败，用户名或邮箱已存在")
    

# 登录接口
@router.post(
  '/login', # 路径  /auth/login
  summary="用户登录", # 摘要
  response_model=common.ApiResponse[auth_schema.LoginSchemaResponse], # 响应模型（信封套数据模型，/docs 里能看到嵌套结构）
)
def login(data: auth_schema.LoginSchemaRequest, db: Session = Depends(get_db)):
  # 校验验证码是否正确
  if not captcha.captcha_verify(data.captcha_id, data.captcha_code):
    raise HTTPException(status_code=400, detail="验证码错误或已过期")
  # rsa解密密码
  try:
    password_str = security.decrypt_password(data.password)
  except Exception:
    raise HTTPException(status_code=400, detail={
        "code": DECRYPT_FAILED,
        "message": "密码解密失败",
    })
  # 这里不使用try语句是因为使用try捕获会捕获数据库挂了等基础设施级别的故障
  # 这种级别的错误应该让fastapi自动抛出500
  user_db = db.execute(
    select(User).where(
      or_(User.username == data.account, User.email == data.account)
    )
  ).scalar_one_or_none() # 从返回的Result中取第一条数据 查不到时返回None
  # 如果用户不存在则提示用户
  # 不要明确告诉用户是用户名还是密码错误，否则攻击者容易确认账号是否有效
  if user_db is None:
    raise HTTPException(status_code=400, detail="用户名或密码错误")
  # 使用解密的密码进行比对
  ph = PasswordHasher()
  try:
    ph.verify(user_db.password_hash, password_str)
  except exceptions.VerifyMismatchError:
    raise HTTPException(status_code=400, detail="用户名或密码错误")
  # 如果都符合则返回token
  return common.ok({"token": security.gen_jwt_token(user_db.id)})


# 当前用户信息接口（需要登录）
@router.get(
  '/me', # 路径  /auth/me
  summary="获取当前登录用户信息",
  response_model=common.ApiResponse[auth_schema.MeSchemaResponse], # 响应模型（信封套用户信息）
  responses={401: {"description": "未登录"}, 402: {"description": "token无效"}, 403: {"description": "token过期"}, 410: {"description": "用户不存在或已被禁用"}}, # 鉴权失败的几种情况也展示到文档里
)
def me(user: User = Depends(get_current_user)):
  """返回当前登录用户的信息"""
  # get_current_user 依赖已经完成了：取请求头token → 验签名和有效期 → 查库确认用户有效
  # 走到这里 user 一定是有效用户，直接返回需要暴露的字段（不返回 password_hash 等敏感字段）
  return common.ok({"id": user.id, "username": user.username, "email": user.email})
