# 认证接口的契约
from pydantic import BaseModel, EmailStr, field_validator


# ========== 请求模型 ==========
class RegisterSchemaRequest(BaseModel):
    """注册请求：用户名 + 密码 + 验证码；邮箱可不填"""
    username: str
    email: EmailStr | None = None  # 不填时是 None，数据库存 NULL；填了就必须是合法邮箱
    password: str
    captcha_id: str
    captcha_code: str

    # 前端如果传来空字符串（而不是干脆不发这个字段），先归一成 None，
    # 否则空字符串过不了 EmailStr 校验，会报 422
    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v

# ========== 响应模型 ==========
class CaptchaSchemaResponse(BaseModel):
    """验证码响应：id + 图片的 data URL"""
    captcha_id: str
    image: str          # "data:image/png;base64,...."，前端直接 <img src={image} />

class PublicKeySchemaResponse(BaseModel):
    """公钥响应：RSA 公钥"""
    public_key: str     # PEM 格式的 RSA 公钥