#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import sys
import requests
import time
from bs4 import BeautifulSoup

BASE_DIR = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
API_BASE = os.environ.get("API_BASE", "http://suzoo_python_vector:8000")
CHECK_INTERVAL = int(os.environ.get("CHECK_INTERVAL", "15"))  # 每隔幾秒檢查一次

def fetch_pending_urls():
    with engine.begin() as conn:
        result = conn.execute(text("SELECT id, url FROM pending_urls WHERE status=0 ORDER BY id ASC"))
        return result.fetchall()

def mark_url_processed(row_id):
    with engine.begin() as conn:
        conn.execute(text("UPDATE pending_urls SET status=1 WHERE id=:id"), {"id": row_id})

def crawl_and_insert_images(the_url):
    print(f"[crawl_and_insert_images] => {the_url}")
    try:
        resp = requests.get(the_url, headers={"User-Agent":"Mozilla/5.0"}, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        images = []
        for imgtag in soup.find_all("img"):
            src = imgtag.get("src")
            if not src:
                continue
            if src.startswith("//"):
                src = "https:" + src
            elif src.startswith("/"):
                # 若需要處理相對路徑，可再自行補上 domain
                pass
            if src.startswith("http"):
                images.append(src)

        print(f"  => Found {len(images)} images in: {the_url}")

        for img_url in images:
            payload = {"image_url": img_url}
            try:
                r = requests.post(f"{API_BASE}/api/v1/image-insert", json=payload, timeout=15)
                if r.status_code == 200:
                    print(f"     Insert OK => {img_url}")
                else:
                    print(f"     Insert FAIL => {img_url} => {r.status_code} {r.text}")
            except Exception as e:
                print(f"     Insert Error => {img_url} => {e}")

    except Exception as ex:
        print(f"[crawl_and_insert_images] error => {the_url} => {ex}")

def main_loop():
    print("[daemon_crawl] Starting infinite loop to check pending_urls every", CHECK_INTERVAL, "secs...")
    while True:
        try:
            rows = fetch_pending_urls()
            if not rows:
                # 沒有新URL，安靜等待
                time.sleep(CHECK_INTERVAL)
                continue

            print(f"[daemon_crawl] found {len(rows)} pending urls => processing now...")
            for row_id, the_url in rows:
                print(f"  => ID={row_id}, URL={the_url}")
                crawl_and_insert_images(the_url)
                mark_url_processed(row_id)
                time.sleep(1)  # 避免太密集

        except Exception as err:
            print("[daemon_crawl] Loop Error =>", err)
            # 發生例外也不要退出循環

        # 間隔 CHECK_INTERVAL 秒再次檢查
        time.sleep(CHECK_INTERVAL)

if __name__=="__main__":
    main_loop()
