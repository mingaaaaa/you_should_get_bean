# 生成ras 公钥和私钥的脚本
from pathlib import Path
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

BASE_DIR = Path(__file__).resolve().parent.parent   # backend/

# 1. 生成私钥
private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

# 2. 私钥序列化成 PEM 文本，写文件
pem_private = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,     # 通用格式，openssl 生成的也是它
    encryption_algorithm=serialization.NoEncryption(),  # 文件本身不设口令（想加密可换 BestAvailableEncryption）
)
(BASE_DIR / "private_key.pem").write_bytes(pem_private)

# 3. 从私钥导出公钥，写文件
pem_public = private_key.public_key().public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo,
)
(BASE_DIR / "public_key.pem").write_bytes(pem_public)

print("已生成 private_key.pem / public_key.pem")