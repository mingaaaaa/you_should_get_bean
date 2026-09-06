# 登录安全相关
import base64
from pathlib import Path
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import padding

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