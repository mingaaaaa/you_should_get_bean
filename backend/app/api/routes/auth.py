# 身份校验路由
from fastapi import APIRouter, Depends
from app.models.schemas.auth import CaptchaSchemaResponse
from app.core import captcha
from app.core.rate_limit import captcha_rate_limit

# 创建路由器对象
# 路由前缀是auth， 标签方便文档进行分类
router = APIRouter(prefix="/auth", tags=["auth"])


# 定义接口
@router.get(
  '/captcha', # 路径  /auth/captcha
  summary="获取验证码", # 摘要
  response_model=CaptchaSchemaResponse, # 响应模型
  # 依赖可以放在单独的路由，也可以放在APIRouter路由组，还可以直接放在应用级别app = FastAPI(dependencies=[Depends(全站日志)])
  dependencies=[Depends(captcha_rate_limit)], # 依赖 因为只需要captcha_rate_limit做校验，所以放在这里
  responses={429: {"description": "请求过于频繁"}}, # /docs 默认只展示 200（和 422），加这段后 429 也出现在文档里
)
# 如果接口函数要使用依赖，就不能放在装饰器的 dependencies 里，而是作为方法形参传入：def get_captcha(limit = Depends(captcha_rate_limit))，然后在函数里用 limit:
def get_captcha():
    """生成验证码信息并返回"""
    return captcha.generate() # 返回id和图片的base64编码
    