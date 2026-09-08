# 认证接口的契约
import re
from pydantic import BaseModel, EmailStr, field_validator

# 判定"像不像邮箱"的正则，和前端 register 页的保持一致，两边判定才不会打架
_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


# ========== 请求模型 ==========
# 注册请求参数
class RegisterSchemaRequest(BaseModel):
    """注册请求：用户名 + 密码 + 验证码；邮箱可不填"""
    username: str
    email: EmailStr | None = None  # 不填时是 None，数据库存 NULL；填了就必须是合法邮箱
    password: str
    captcha_id: str
    captcha_code: str

    # 前端如果传来空字符串（而不是干脆不发这个字段），先归一成 None，
    # 否则空字符串过不了 EmailStr 校验，会报 422
    # 声明一个字段校验器  在类型转换和校验之前执行
    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, v):
        # 判断是否为空字符串
        if isinstance(v, str) and not v.strip():
            return None
        return v

    # 用户名不能是邮箱格式：登录时一个 account 字段同时按用户名/邮箱两列查询，
    # 邮箱格式的用户名可能跟别人的注册邮箱撞车（两列同时命中，登录查询直接 500）
    @field_validator("username")
    @classmethod
    def username_not_email(cls, v):
        if _EMAIL_RE.match(v.strip()):
            raise ValueError("用户名不能是邮箱格式")
        return v

# 登录请求参数
class LoginSchemaRequest(BaseModel):
    """登录请求：账户(用户名或密码) + 密码 + 验证码"""
    account: str
    password: str
    captcha_id: str
    captcha_code: str


# ========== 响应模型 ==========
class CaptchaSchemaResponse(BaseModel):
    """验证码响应：id + 图片的 data URL"""
    captcha_id: str
    image: str          # "data:image/png;base64,...."，前端直接 <img src={image} />

class PublicKeySchemaResponse(BaseModel):
    """公钥响应：RSA 公钥"""
    public_key: str     # PEM 格式的 RSA 公钥

# 登录请求参数
class LoginSchemaResponse(BaseModel):
    """登录响应：包含访问令牌"""
    token: str

# 当前用户信息响应
class MeSchemaResponse(BaseModel):
    """当前登录用户信息：/auth/me 用，token 验证通过后返回"""
    id: int
    username: str
    email: EmailStr | None = None  # 注册时邮箱可不填，所以可能为 None