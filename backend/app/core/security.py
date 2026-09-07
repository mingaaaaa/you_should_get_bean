# 登录安全相关
import base64
from pathlib import Path
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import padding
import jwt
from datetime import datetime, timedelta, timezone
from app.core import config

# 数清楚层级：security.py 在 backend/app/core/ 下
# .parent=core → .parent.parent=app → .parent.parent.parent=backend，私钥放 backend/ 根下
_KEY_PATH = Path(__file__).resolve().parent.parent.parent / "private_key.pem"

try:
  # 读取私钥
  with open(_KEY_PATH, "rb") as f:
    _private_key = serialization.load_pem_private_key(f.read(), password=None)
except:
  raise RuntimeError(f"私钥文件不存在，请先运行 `python scripts/gen_rsa.py` 生成私钥和公钥，路径：{_KEY_PATH}")

# 获取公钥
def get_public_key() -> str:
    """从私钥导出公钥 PEM，发给前端"""
    pem = _private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return pem.decode("ascii")

def decrypt_password(cipher_b64: str) -> str:
    """解开前端传来的 base64 密文，还原明文密码"""
    cipher = base64.b64decode(cipher_b64)          # 第一步：base64 还原成 256 字节的密文数字块
    plain = _private_key.decrypt(cipher, padding.PKCS1v15())  # 第二步：私钥解密 + 去填充
    return plain.decode("utf-8")                   # 第三步：字节串还原成字符串

# 生成jwt
def gen_jwt_token(user_id: int) -> str:
  """签发 JWT：把用户 id 和过期时间写进 payload，用密钥签名"""
  now = datetime.now(timezone.utc)
  payload = {
    "sub": str(user_id),   # sub 是标准声明，代表"这个 token 属于谁"，规范要求是字符串
    "iat": now,            # 签发时间
    "exp": now + timedelta(minutes=config.JWT_EXPIRE_MINUTES),  # 过期时间，PyJWT 解码时自动校验
  }
  return jwt.encode(payload, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)

# 校验jwt
# 过期会抛 jwt.ExpiredSignatureError，签名不对/被篡改抛 jwt.InvalidTokenError
def verify_jwt_token(token: str) -> int:
  """验证 JWT 签名和有效期，通过则返回用户 id"""
  payload = jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])
  return int(payload["sub"]) # 返回用户id
