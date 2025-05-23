import os
import time
import psycopg2
import requests

# 若 .env 中沒有設定 POSTGRES_HOST，就默認使用 suzoo_postgres
DB_HOST = os.getenv('POSTGRES_HOST', 'suzoo_postgres')
DB_PORT = os.getenv('POSTGRES_PORT', '5432')
DB_USER = os.getenv('POSTGRES_USER', 'postgres')
DB_PASS = os.getenv('POSTGRES_PASSWORD', '')
DB_NAME = os.getenv('POSTGRES_DB', 'suzoo_db')

BANNED_LIST_STR = os.getenv('DMCA_BANNED_FINGERPRINTS','')
BANNED_FPS = {fp.strip() for fp in BANNED_LIST_STR.split(',') if fp.strip()}

def connect_db():
    conn = None
    while not conn:
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                user=DB_USER,
                password=DB_PASS,
                dbname=DB_NAME
            )
            conn.autocommit = True
            print("Crawler: 資料庫連線成功")
        except Exception as e:
            print("Crawler: 資料庫尚未就緒，5秒後重試...", e)
            time.sleep(5)
    return conn

def remove_from_ipfs(ipfs_hash):
    # 若 .env 中沒設 IPFS_API_URL, 就預設 http://suzoo_ipfs:5001
    ipfs_url = os.getenv('IPFS_API_URL','http://suzoo_ipfs:5001')
    try:
        r = requests.post(f"{ipfs_url}/api/v0/pin/rm", params={"arg": ipfs_hash}, timeout=5)
        if r.ok:
            print(f"Crawler: 已從IPFS移除 {ipfs_hash}")
        else:
            print(f"Crawler: 移除失敗: {r.text}")
    except Exception as e:
        print(f"Crawler: IPFS移除錯誤 {e}")

def main():
    if not BANNED_FPS:
        print("Crawler: 未設定 DMCA 違規指紋清單，無法偵測")
    conn = connect_db()
    cur = conn.cursor()
    while True:
        try:
            if BANNED_FPS:
                cur.execute("SELECT id, fingerprint, ipfs_hash FROM files WHERE dmca_flag=false")
                rows = cur.fetchall()
                for f_id, f_fp, ipfsH in rows:
                    if f_fp in BANNED_FPS:
                        print(f"Crawler: 發現違規檔案 id={f_id} fp={f_fp} -> 移除")
                        cur.execute("UPDATE files SET dmca_flag=true WHERE id=%s",[f_id])
                        if ipfsH:
                            remove_from_ipfs(ipfsH)
            time.sleep(15)
        except Exception as e:
            print("Crawler error:", e)
            time.sleep(15)

if __name__=="__main__":
    main()
