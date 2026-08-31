# 数据库连接脚本
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import DATABASE_URL

engine = create_engine(
  DATABASE_URL, 
  pool_size=5, # 连接池大小，默认5
  max_overflow=10, # 超过连接池大小外最多创建的连接数，默认10
  pool_recycle=3600, # 连接池中连接的最大存活时间，单位秒，默认-1（永不回收）
  pool_pre_ping=True, # 开启连接池的连接健康检查，默认False（借出前先 ping，死连接自动重建）
  echo=True,  # 打印执行的SQL语句；推荐在开发环境使用，生产环境建议设为 False
  future=True # 开启SQLAlchemy 2.0风格的API
)  

# 会话工厂
#sessionmaker方法用来创建一个会话类，返回一个新的会话类对象。这个会话类对象可以用来创建新的会话实例。
SessionLocal = sessionmaker(
  bind=engine, # 绑定引擎
  autoflush=False, # 自动刷新，默认True；False表示不会在提交前自动刷新对象到数据库
  expire_on_commit=False # 提交后不失效，默认True；False表示提交后对象仍然可用
)
# 会话用来操作数据库。


Base = declarative_base() # 创建一个基础类，用于定义模型类（ORM映射类）