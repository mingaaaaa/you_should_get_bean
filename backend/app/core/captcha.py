# 验证码相关功能方法，例如生成图片等。。。
from PIL import Image, ImageDraw, ImageFont
import random
import io
import base64
import uuid
import time

WIDTH, HEIGHT = 120, 40  # 验证码图片的宽度和高度

EXPIRE_TIME = 5 * 60  # 验证码过期时间，单位为秒
_store: dict[str, tuple[str, float]] = {} # 存储验证码的字典，{id:(编码，过期时间)}

def _random_color(min_val=0, max_val=255):
    """生成随机颜色"""
    return tuple(random.randint(min_val, max_val) for _ in range(3))

def _load_font(size=24):
    """加载字体和大小，兼容win和Linux"""
    candidates = [
      "C:/Windows/Fonts/arial.ttf",
      "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
      "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
      ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()

def _draw_image(text):
    """绘制验证码图片"""
    image = Image.new('RGB', (WIDTH, HEIGHT), _random_color(200, 255)) # 浅底
    draw = ImageDraw.Draw(image)
    font = _load_font(24)

    # 绘制数字，横排等距+纵向抖动
    for i, char in enumerate(text):
        x = 10 + i * 20  # 横向间距为 20
        y = random.randint(0, 10) # 纵向抖动范围为 0~10
        draw.text((x, y), char, font=font, fill=_random_color(0, 150)) # 深色

    # 绘制干扰线
    for _ in range(5):
        x1 = random.randint(0, WIDTH) # 随机起点X
        y1 = random.randint(0, HEIGHT) # 随机起点Y
        x2 = random.randint(0, WIDTH) # 随机终点X
        y2 = random.randint(0, HEIGHT) # 随机终点Y
        draw.line(((x1, y1), (x2, y2)), fill=_random_color(150, 200), width=1)

    # 绘制干扰点
    for _ in range(30):
        x = random.randint(0, WIDTH)
        y = random.randint(0, HEIGHT)
        draw.point((x, y), fill=_random_color(0, 255))
    
    buf = io.BytesIO() # 创建一个内存中的字节流对象
    image.save(buf, format='PNG') # 将图片保存到字节流中，格式为PNG
    b64 = base64.b64encode(buf.getvalue()).decode("ascii") # 将字节流编码为base64字符串
    return f"data:image/png;base64,{b64}"

def generate() -> dict[str, str]:
    """生成验证码id和图片的base64编码并返回"""
    code = ''.join(random.choices('0123456789', k=4)) # 生成4位随机数字验证码
    captcha_id = str(uuid.uuid4()) # 生成唯一的验证码id

    now = time.time() # 获取当前时间戳
    # 删除过期验证码（迭代副本再删除，直接在 items() 迭代中 del 会抛 RuntimeError）
    for id,(text, timestamp) in list(_store.items()):
        if now > timestamp:
            del _store[id]
    _store[captcha_id] = (code, now + EXPIRE_TIME) # 存储验证码和过期时间
    return {"captcha_id": captcha_id, "image": _draw_image(code)}


def captcha_verify(captcha_id: str, code: str) -> bool:
    """验证验证码是否正确"""
    answer_tuple = _store.get(captcha_id) # 获取验证码答案
    # 获取到后该记录直接删除,因为只要开始校验了，这条记录必定是过期的
    _store.pop(captcha_id, None)
    # 如果store中没有该记录表示非法数据，返回false
    if answer_tuple is None:
        return False
    # 如果验证码过期，返回false
    if time.time() > answer_tuple[1]:
        del _store[captcha_id]
        return False
    # 如果验证码不匹配，返回false
    if answer_tuple[0] != code:
        return False
    return True