# GetBean 后端服务

FastAPI + SQLAlchemy + MySQL

## 环境准备（首次使用）

1. 创建并激活虚拟环境：

```powershell
python -m venv .venv
.\.venv\Scripts\activate
```

2. 安装依赖：

```powershell
pip install -r requirements.txt
```

3. 在 `backend/` 下配置 `.env`（参考已有配置，需要以下键）：

```
DATABASE_URL=mysql+pymysql://用户名:密码@localhost:3306/beans_db?charset=utf8mb4
JWT_SECRET=一段足够长的随机字符串
```

4. 初始化数据库（建库 + 建表）：

```powershell
python scripts/init_db.py
```

5. 生成 RSA 密钥对（登录/注册密码传输加密用）：

```powershell
python scripts/gen_rsa.py
```

> `private_key.pem` 已被 .gitignore 排除，绝不入库；克隆项目后必须重新生成。

## 启动服务

```powershell
cd backend
.\.venv\Scripts\activate        # 激活虚拟环境，提示符出现 (.venv) 前缀才算成功
uvicorn app.main:app --reload
```

- 服务地址：http://127.0.0.1:8000
- 接口文档：http://127.0.0.1:8000/docs

> 提示符没有 `(.venv)` 前缀时命令仍可能"能跑"，但会跑到全局 Python 上，出现包缺失等怪错。
> 可用 `Get-Command uvicorn` 确认命令解析到哪个环境（带 `.venv\Scripts\` 才是对的），
> 或直接使用 `.\.venv\Scripts\uvicorn.exe app.main:app --reload` 绕过激活。

## 常用文件

- `app/main.py` —— 应用入口（FastAPI 实例、异常处理器、路由挂载）
- `app/api/routes/` —— 接口路由
- `app/schemas/` —— 请求/响应模型（Pydantic）
- `app/models/` —— 数据库表模型（SQLAlchemy ORM）
- `app/core/` —— 核心逻辑（数据库、验证码、安全、限流）
- `scripts/` —— 一次性脚本（建库、生成密钥）
- `test_page.html` —— 注册/登录测试页（浏览器直接打开）
