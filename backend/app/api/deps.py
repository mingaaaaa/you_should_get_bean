# 公共依赖：多个接口都要用的"入场检查/资源借还"
# （get_db：借还数据库会话；以后的 get_current_user：验登录态
from app.core.database import SessionLocal

def get_db():
    """获取数据库会话的依赖"""
    db = SessionLocal() # 借出数据库会话
    try:
        yield db # 交给接口函数使用
    finally:
        db.close() # 归还数据库会话