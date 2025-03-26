import os
import psycopg2
import redis
from fastapi import FastAPI

app = FastAPI()

DB_HOST = os.environ.get('DB_HOST', 'db')  # docker-compose service name
DB_PORT = os.environ.get('DB_PORT', '5432')
DB_USER = os.environ.get('DB_USER', 'postgres')
DB_PASS = os.environ.get('DB_PASS', 'KaiShieldDbPass123')
DB_NAME = os.environ.get('DB_NAME', 'kaishield_db')

REDIS_HOST = os.environ.get('REDIS_HOST', 'redis')
REDIS_PORT = os.environ.get('REDIS_PORT', '6379')

def get_db_conn():
    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT
    )

@app.get("/fastapi/healthz")
def health_check():
    return {"status": "ok", "msg": "fastapi service running"}

@app.get("/fastapi/dbtest")
def dbtest():
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute("SELECT NOW()")
        row = cur.fetchone()
        cur.close()
        conn.close()
        return {"ok": True, "db_time": str(row[0])}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.get("/fastapi/redistest")
def redistest():
    try:
        r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        r.set("testkey", "testvalue")
        val = r.get("testkey")
        return {"ok": True, "redis_value": val}
    except Exception as e:
        return {"ok": False, "error": str(e)}
