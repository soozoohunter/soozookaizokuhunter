import os
import time
import requests
import sqlite3
from celery import Celery
from bs4 import BeautifulSoup

BROKER_URL = os.environ.get("BROKER_URL", "amqp://admin:123456@suzoo_rabbitmq:5672//")
RESULT_BACKEND = os.environ.get("RESULT_BACKEND", "rpc://")

API_BASE = os.environ.get("API_BASE", "http://suzoo_python_vector:8000")
DB_PATH  = os.environ.get("DB_PATH", "sources.db")

app = Celery("tasks", broker=BROKER_URL, backend=RESULT_BACKEND)

@app.task
def crawl_url(record_id, url):
    """
    長期任務：爬取URL裡的圖片並插入向量DB
    record_id: pending_urls 表格中的id
    """
    print(f"[Celery] crawl_url => (id={record_id}) {url}")
    # 1) 爬取
    try:
        headers = {"User-Agent":"Mozilla/5.0"}
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        images = []
        for imgtag in soup.find_all("img"):
            src = imgtag.get("src")
            if src and src.startswith("http"):
                images.append(src)
            elif src and src.startswith("//"):
                # 補上 scheme
                images.append("https:" + src)
        print(f"[Celery] found {len(images)} images from {url}")

        # 2) 每個圖都 insert
        for img_url in images:
            try:
                payload = {"image_url": img_url}
                r = requests.post(f"{API_BASE}/api/v1/image-insert", json=payload, timeout=20)
                if r.status_code == 200:
                    print(f"  => Insert OK: {img_url}")
                else:
                    print(f"  => Insert FAIL {r.status_code}: {img_url} => {r.text}")
            except Exception as e:
                print(f"  => Insert error: {img_url}, {e}")

        # 3) 標記DB status=1
        mark_url_processed(record_id)
    except Exception as e:
        print(f"[Celery] crawl_url error => {url} => {e}")
        # 如果失敗，可設定重試或紀錄

def mark_url_processed(record_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE pending_urls SET status=1 WHERE id=?", (record_id,))
    conn.commit()
    c.close()
    conn.close()
