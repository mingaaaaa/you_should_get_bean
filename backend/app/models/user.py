# users 表的 ORM 模型
from datetime import datetime
from sqlalchemy import Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base  # 导入基础类

# 定义一个表模型就是继承Prisma的基类去定义一个类
class User(Base):
    __tablename__ = "users"  # 表名
    # SQLAlchemy 2.0 风格  Column是1.0的风格
    # Mapped[int]  id 的类型注解
    # index=True  给该字段创建索引，便于查询
    id: Mapped[int] = mapped_column(Integer, primary_key=True)  # 整型，主键，自增  主键自带索引所以不需要设置index=True
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)  # 用户名，字符串，唯一，索引，不为空
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=True)  # 邮箱，字符串，唯一，索引，可以为空(因为是邮箱可选的)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)  # 密码哈希值，字符串，不为空
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)  # 是否激活，布尔型，默认True
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())  # 创建时间，日期时间型，默认当前时间
    updated_at:Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())  # 更新时间，日期时间型，默认当前时间，并在更新时自动更新