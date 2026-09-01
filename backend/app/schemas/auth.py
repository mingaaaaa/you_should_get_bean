# 认证接口的契约
from pydantic import BaseModel, EmailStr


# ========== 请求模型 ==========

# ========== 响应模型 ==========
class CaptchaSchemaResponse(BaseModel):
    """验证码响应：id + 图片的 data URL"""
    captcha_id: str
    image: str          # "data:image/png;base64,...."，前端直接 <img src={image} />