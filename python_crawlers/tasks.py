import os
import sqlite3
import requests
from celery import Celery
from bs4 import BeautifulSoup

BROKER_URL = os.environ.get("BROKER_URL", "amqp://admin:123456@suzoo_rabbitmq:5672//")
RESULT_BACKEND = os.environ.get("RESULT_BACKEND", "rpc://")

app = Celery("tasks", broker=BROKER_URL, backend=RESULT_BACKEND)

DB_PATH  = os.environ.get("DB_PATH", "/app/sqlite_db/sources.db")
API_BASE = os.environ.get("API_BASE", "http://suzoo_python_vector:8000")

@app.task(name="tasks.crawl_url")
def crawl_url(record_id, url):
    """
    Celery任務：爬取該 url 裏的所有圖片(可擴充影片或文字)，
    呼叫 /api/v1/image-insert -> 儲存至 Milvus，
    最後將 pending_urls.status=1
    """
    print(f"[Celery Worker] crawl_url => (id={record_id}) {url}")
    try:
        # 簡易平台判斷，示範可以區分各平台寫不同的爬蟲
        images = []
        lower_url = url.lower()
        if "shopee" in lower_url:
            images = fallback_crawl_images(url)
        elif "instagram.com" in lower_url:
            images = fallback_crawl_images(url)
        elif "facebook.com" in lower_url:
            images = fallback_crawl_images(url)
        elif "tiktok.com" in lower_url:
            images = fallback_crawl_images(url)
        elif "youtube.com" in lower_url:
            images = fallback_crawl_images(url)
        else:
            images = fallback_crawl_images(url)

        print(f"  => Found {len(images)} images from {url}")
        for img_url in images:
            try:
                r = requests.post(f"{API_BASE}/api/v1/image-insert", json={"image_url": img_url}, timeout=15)
                if r.status_code == 200:
                    print(f"     Insert OK => {img_url}")
                else:
                    print(f"     Insert FAIL => {img_url} => {r.status_code}, {r.text}")
            except Exception as ex:
                print(f"     Insert error => {img_url}, {ex}")

        mark_url_processed(record_id)

    except Exception as e:
        print(f"[Celery Worker] crawl_url error => {url}, {e}")

def fallback_crawl_images(page_url):
    """
    使用 requests + BeautifulSoup 下載 <img src=...>
    只做示範，可自行擴充(抓 <video>, <audio>... )或改成 selenium
    """
    images = []
    try:
        resp = requests.get(page_url, headers={"User-Agent":"Mozilla/5.0"}, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        for imgtag in soup.find_all("img"):
            src = imgtag.get("src")
            if not src:
                continue
            if src.startswith("//"):
                src = "https:" + src
            if src.startswith("http"):
                images.append(src)
    except Exception as ex:
        print(f"[fallback_crawl_images] error => {page_url}, {ex}")
    return images

def mark_url_processed(row_id):
    """
    將該 URL status=1
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("UPDATE pending_urls SET status=1 WHERE id=?", (row_id,))
        conn.commit()
        c.close()
        conn.close()
        print(f"[Celery] record_id={row_id} => status=1")
    except Exception as e:
        print(f"[Celery] mark_url_processed error => {row_id}, {e}")
