// 密码加密：用后端 /auth/public_key 发的 RSA 公钥加密，后端用私钥解密
import { JSEncrypt } from "jsencrypt";

export function encryptPassword(publicKey: string, plain: string): string | null {
  const encrypt = new JSEncrypt();
  encrypt.setPublicKey(publicKey);
  // jsencrypt 输出 base64 密文（PKCS#1 v1.5 填充），失败时返回 false
  const cipher = encrypt.encrypt(plain);
  return cipher === false ? null : cipher;
}
