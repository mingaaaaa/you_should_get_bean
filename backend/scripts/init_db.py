# 用来创建数据库的脚本

import sys
from pathlib import Path

# —— 自带寻路：无论从哪个目录、用什么方式启动本脚本，都能定位到 backend/ ——
BASE_DIR = Path(__file__).resolve().parent.parent   # 本文件在 scripts/ 里，上一级就是 backend/
sys.path.insert(0, str(BASE_DIR))                   # 把 backend/ 塞进模块搜索路径最前面

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import os

# 明确指定 .env 位置，不靠"从当前目录向上搜索"
load_dotenv(BASE_DIR / ".env") 
url = os.getenv("DATABASE_URL")

# 完整连接串指向 beans_db，但建库必须连到"服务器本身"
# 所以把最后的 /beans_db?... 部分砍掉，变成 mysql+pymysql://root:123456@localhost:3306/
# rsplit  从右往左按指定的分隔符切割字符串，返回一个列表，第二个参数为分割次数，可以不传(全部分割也就是传入-1)或者传入正整数(分割次数)
DATABASE_URL = url.rsplit("/", 1)[0] + "/"

# create_engine() 创建了一个“连接池管理者”对象，此时还没有发起网络请求进行连接
server_engine = create_engine(DATABASE_URL)
# connect()方法发起TCP 连接、MySQL 握手、密码认证
# with... as ...  自动管理资源的上下文管理器。进入时自动调用 __enter__，离开时自动调用 __exit__，不管有没有报错。
# 主要是为了去报在连接的时候，无论成功还是异常都会自动关闭连接，避免连接泄漏，有点想try..finally,无论如何都会finally去关闭连接
with server_engine.connect() as conn:
    # executez()方法发起SQL语句的执行请求，返回一个结果集对象
    # execute 要求传入的是"可执行对象",text() 就是把字符串变成可执行对象的包装器。
    conn.execute(text(
        "CREATE DATABASE IF NOT EXISTS beans_db "   #创建beans_db数据库，如果已经存在就不创建
        "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"  # 字符集用 utf8mb4（能存中文、emoji）排序规则用 unicode_ci（ci = case insensitive，不区分大小写）
    ))
#     text(...)：SQLAlchemy 2.0 的强制要求——传给 execute() 的字符串必须包在 text() 里，明确声明“这是字面 SQL”。
# 这是它防 SQL 注入设计的一部分（参数必须走绑定，不允许字符串拼接）。
# 两个字符串挨着写自动拼接："CREATE ... beans_db " 和 "CHARACTER SET ..." 之间没有 +，
# Python 会把相邻的字符串字面量自动连成一个——纯粹为了排版好看，长 SQL 拆行写不用拖一长串加号。

    # 提交事务
    conn.commit()
    print("数据库 beans_db 已就绪")


from app.core.database import Base, engine
from app.models.user import User # 导入即执行 → User 类被创建 → 表结构登记进 Base.metadata

Base.metadata.create_all(bind=engine)  # 创建所有表