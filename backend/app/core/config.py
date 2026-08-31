# 从.env文件中读取配置
from dotenv import load_dotenv
import os

load_dotenv() # 将.env文件中的键值对配置加载进来到当前程序中(当前Python 进程的环境变量)

# os.environ（Python 进程的环境变量字典）
# os.getenv("DB_HOST") 本质上就是：
# os.environ["DATABASE_URL"]  # 从这个内存字典里取值
DATABASE_URL = os.getenv("DATABASE_URL") # 获取对应key的配置的值并存到指定变量中