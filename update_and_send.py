import os
import datetime
import pandas as pd
import baostock as bs
import requests
import json
from io import BytesIO

# ---------------- 配置 ----------------
WORKER_ENDPOINT = os.getenv("WORKER_ENDPOINT")
WORKER_AUTH_TOKEN = os.getenv("WORKER_AUTH_TOKEN")
START_DATE = "2008-01-01"

if not all([WORKER_ENDPOINT, WORKER_AUTH_TOKEN]):
    raise ValueError("环境变量未完全设置，请检查 WORKER_ENDPOINT 和 WORKER_AUTH_TOKEN")

# ---------------- Baostock 登录 ----------------
def login_baostock():
    lg = bs.login()
    if lg.error_code != "0":
        raise RuntimeError(f"Baostock 登录失败: {lg.error_msg}")
    print("✅ Baostock 登录成功")
    return lg

# ---------------- 数据获取与发送 ----------------
def fetch_history(ts_code):
    """获取全量历史行情"""
    print(f"正在获取 {ts_code} 的全量历史数据...")
    today = datetime.date.today().strftime("%Y-%m-%d")
    rs = bs.query_history_k_data_plus(
        ts_code,
        "date,open,high,low,close,volume,amount",
        start_date=START_DATE,
        end_date=today,
        frequency="d",
        adjustflag="2",  # 后复权
    )
    data = []
    while (rs.error_code == "0") & rs.next():
        data.append(rs.get_row_data())
    df = pd.DataFrame(data, columns=rs.fields)
    print(f"获取到 {len(df)} 条记录")
    return df

def send_data_to_worker(ts_code, df):
    """将数据转换为 Parquet 并发送给 Worker"""
    if df.empty:
        print(f"⚠️ {ts_code} 无数据，跳过上传")
        return
        
    # 将 DataFrame 转换为 Parquet 格式的二进制数据
    buffer = BytesIO()
    df.to_parquet(buffer, index=False)
    buffer.seek(0)
    
    # 构建请求
    headers = {
        "X-API-KEY": WORKER_AUTH_TOKEN,
        "Content-Type": "application/octet-stream",
        "X-Stock-Code": ts_code,
    }
    
    # 发送 POST 请求到 Worker
    try:
        response = requests.post(
            WORKER_ENDPOINT,
            data=buffer,
            headers=headers
        )
        response.raise_for_status() # 检查 HTTP 错误
        print(f"✅ {ts_code} 数据已成功发送给 Worker，响应: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"❌ 发送数据给 Worker 失败: {e}")
        raise

def main():
    print("🚀 开始执行股票数据获取与发送脚本...")
    lg = login_baostock()

    # 获取所有股票代码列表
    print("正在获取所有股票列表...")
    
    # 修正: 移除已废弃的 'code_name' 参数
    rs = bs.query_all_stock()
    
    stock_list = []
    while (rs.error_code == '0') & rs.next():
        stock_list.append(rs.get_row_data())
    
    df_stocks = pd.DataFrame(stock_list, columns=rs.fields)
    print(f"找到 {len(df_stocks)} 只股票。")

    for index, row in df_stocks.iterrows():
        ts_code = row["code"]
        # 获取股票数据
        df_history = fetch_history(ts_code)
        # 将数据发送给 Worker
        send_data_to_worker(ts_code, df_history)

    bs.logout()
    print("✅ 所有任务完成，Baostock 已登出。")

if __name__ == "__main__":
    main()
