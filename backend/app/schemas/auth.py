# 认证接口的契约
from pydantic import BaseModel, EmailStr


# ========== 请求模型 ==========
class RegisterSchemaRequest(BaseModel):
    """注册请求：用户名 + 邮箱 + 密码 + 验证码"""
    username: str
    email: EmailStr | None
    password: str
    captcha_id: str
    captcha_code: str

# ========== 响应模型 ==========
class CaptchaSchemaResponse(BaseModel):
    """验证码响应：id + 图片的 data URL"""
    captcha_id: str
    image: str          # "data:image/png;base64,...."，前端直接 <img src={image} />


class RegisterSchemaResponse(BaseModel):
    """注册响应：注册成功"""
    message: str = "注册成功"