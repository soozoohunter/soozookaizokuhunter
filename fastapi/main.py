import psycopg2
import redis
import requests
from fastapi import FastAPI

app = FastAPI()

# ====== 硬編碼資料庫資訊 ======
DB_USER = "postgres"
DB_PASS = "KaiShieldDbPass123"
DB_NAME = "kaishield_db"
DB_HOST = "127.0.0.1"
DB_PORT = 5432

# ====== RapidAPI Key ======
RAPID_API_KEY = "71dbbf39f7msh794002260b4e71bp1025e2jsn652998e0f81a"

# ====== 連線 PostgreSQL ======
def get_db_conn():
    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT
    )

# ====== 連線 Redis ======
redis_client = redis.Redis(host='127.0.0.1', port=6379, decode_responses=True)

@app.get("/fastapi/healthz")
def health_check():
    return {"status": "ok", "source": "fastapi", "timestamp": "v2 final check"}

@app.get("/fastapi/dbtest")
def db_test():
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute("SELECT NOW()")
        row = cur.fetchone()
        cur.close()
        conn.close()
        return {"ok": True, "current_time": str(row[0])}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.get("/fastapi/tiktok-trending")
def tiktok_trending():
    try:
        url = "https://tiktok-scraper7.p.rapidapi.com/trending/feed"
        headers = {
            "X-RapidAPI-Key": RAPID_API_KEY,
            "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com"
        }
        resp = requests.get(url, headers=headers)
        data = resp.json()
        return {"ok": True, "data": data}
    except Exception as e:
        return {"ok": False, "error": str(e)}
