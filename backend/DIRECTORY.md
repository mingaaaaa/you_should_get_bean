# Backend 目录结构说明

> 本文档记录 Python 后台服务（FastAPI + MySQL）的目录结构设计及各部分职责。
> 技术栈：FastAPI + SQLAlchemy 2.0 + PyMySQL + bcrypt + PyJWT

## 目录结构总览

```
backend/
├── .env                      # 真实配置（数据库密码、JWT 密钥），不进 git
├── .env.example              # 配置模板（只含字段名和示例值），进 git
├── .gitignore                # 忽略 .venv/、.env、__pycache__/ 等
├── requirements.txt          # Python 依赖清单（pip freeze 固定版本）
├── scripts/
│   └── init_db.py            # 一次性初始化脚本：建库（IF NOT EXISTS）+ 建表（create_all）
│                             # 手动运行，不随服务启动自动执行
└── app/
    ├── __init__.py
    ├── main.py               # FastAPI 应用入口：创建 app、注册路由、配置 CORS
    ├── core/                 # 通用基础能力（与具体业务无关）
    │   ├── __init__.py
    │   ├── config.py         # 集中读取 .env 环境变量（数据库地址、JWT 密钥等）
    │   ├── database.py       # SQLAlchemy 引擎 + Session 工厂（连接池）
    │   └── security.py       # 密码哈希（bcrypt）、JWT 签发与校验
    ├── models/               # 数据库层：SQLAlchemy 模型，与表结构一一对应
    │   ├── __init__.py
    │   └── user.py           # User 模型（对应 users 表）
    ├── schemas/              # 接口契约层：Pydantic 模型（请求体/响应体）
    │   ├── __init__.py
    │   └── auth.py           # 注册/登录的请求与响应模型
    └── api/
        ├── __init__.py
        ├── deps.py           # 公共依赖：get_db（数据库会话）、get_current_user（鉴权）
        └── routes/
            ├── __init__.py
            └── auth.py       # 认证路由：POST /api/auth/register、POST /api/auth/login
```

## 分层设计说明

整体分为四层，各层只向下依赖，避免循环导入：

| 层 | 目录 | 职责 | 依赖方向 |
|----|------|------|----------|
| 通用层 | `core/` | 配置、数据库连接、安全工具 | 不依赖业务代码 |
| 数据层 | `models/` | 定义表结构，操作数据库对象 | 依赖 core |
| 契约层 | `schemas/` | 定义 API 入参/出参格式与校验规则 | 依赖 core |
| 接口层 | `api/` | 路由与业务流程编排 | 依赖 models、schemas、core |

**为什么这样分：**

- **models 与 schemas 分开**：数据库模型和接口契约是两个概念（例如 User 模型含
  `password_hash` 字段，但任何接口的响应都不应返回它），分开后可以在响应模型里
  显式排除敏感字段。
- **deps.py 抽公共依赖**：`get_current_user` 集中实现 JWT 鉴权，任何需要登录的
  接口只需在参数中写 `Depends(get_current_user)`，鉴权逻辑只维护一份。
- **core/ 与业务无关**：以后新增业务模块（如订单、文章），只需新增
  `models/xxx.py`、`schemas/xxx.py`、`api/routes/xxx.py`，core 层不动。

## 后续扩展预留

新增业务模块时按同样结构添加即可，例如：

```
app/
├── models/order.py           # 新增：订单表模型
├── schemas/order.py          # 新增：订单接口契约
└── api/routes/orders.py      # 新增：订单路由（参数加 Depends(get_current_user) 即为登录态接口）
```

## 关键接口一览（第一步：登录功能）

| 方法 | 路径 | 说明 | 是否需要登录 |
|------|------|------|--------------|
| POST | `/api/auth/register` | 注册用户（bcrypt 哈希密码入库） | 否 |
| POST | `/api/auth/login` | 登录，校验成功返回 JWT | 否 |
| GET | `/api/users/me` | 获取当前登录用户信息 | 是（Bearer token） |

## 启动方式（实现后）

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# 首次搭建环境（或换电脑/删库重来）时，手动运行一次初始化脚本建库建表：
python scripts/init_db.py

# 之后每次开发只需启动服务：
uvicorn app.main:app --reload --port 8000
```

- 接口文档（Swagger UI）：http://localhost:8000/docs
- 前端（Next.js，端口 3000）跨域已在 CORS 中放行 `http://localhost:3000`
