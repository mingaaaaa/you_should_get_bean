# 项目约定

前后端分离项目：`frontend/`（Next.js 16 + React 19 + Tailwind CSS 4）、`backend/`（FastAPI + SQLAlchemy + MySQL）。前端通过 Next rewrites 把 `/api/*` 代理到后端 `127.0.0.1:8000`。

## 前端（frontend/）

- **不要用 `pnpm build`（next build）做代码验证**，耗时长且没必要。验证代码请用：
  - `pnpm lint`：ESLint 检查
  - `npx tsc --noEmit`：TypeScript 类型检查
- 本地调试运行 `pnpm dev`。

### Next.js 版本警告

本项目使用的 Next.js 版本相对常见训练数据有 breaking changes——API、约定、文件结构都可能不同。写前端代码前先读 `frontend/node_modules/next/dist/docs/` 下的相关文档，并留意弃用提示。

## 后端（backend/）

- 依赖装在 `backend/.venv`（不在 git 仓库中）。执行命令前先激活虚拟环境：`.\.venv\Scripts\activate`，或直接用 `.\.venv\Scripts\uvicorn.exe ...` 绕过激活；提示符没有 `(.venv)` 前缀时命令可能跑到全局 Python 上。
- 启动开发服务：`uvicorn app.main:app --reload`（服务地址 http://127.0.0.1:8000，接口文档 /docs）。
- 运行依赖 `backend/.env`（`DATABASE_URL`、`JWT_SECRET` 等真实值，不入库）和 RSA 密钥对（`python scripts/gen_rsa.py` 生成，`private_key.pem` 已被 .gitignore 排除，克隆后必须重新生成）。
- 一次性脚本在 `backend/scripts/`：初始化数据库 `init_db.py`、生成密钥对 `gen_rsa.py`。
