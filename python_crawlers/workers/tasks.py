# python_crawlers/workers/tasks.py
import os
from celery import Celery
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication

BROKER_URL = os.environ.get("BROKER_URL", "amqp://admin:123456@suzoo_rabbitmq:5672//")
RESULT_BACKEND = os.environ.get("RESULT_BACKEND", "rpc://")

celery = Celery("tasks", broker=BROKER_URL, backend=RESULT_BACKEND)

@celery.task
def send_report_email(report_path, recipient_email):
    # 這裡示範簡單地透過 smtplib 寄信(需設定郵件服務)
    msg = MIMEMultipart()
    msg["Subject"] = "Suzoo 侵權掃描報告"
    msg["From"] = "noreply@suzoo.com"
    msg["To"] = recipient_email

    with open(report_path, "rb") as f:
        pdf_data = f.read()
    attach = MIMEApplication(pdf_data, _subtype="pdf")
    attach.add_header('Content-Disposition', 'attachment', filename="scan_report.pdf")
    msg.attach(attach)

    # DEMO: 例如用本機smtp
    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        # server.starttls()
        # server.login("xxx", "xxx")
        server.send_message(msg)

    return f"Email sent to {recipient_email}"

@celery.task
def crawl_and_index_shopee():
    # 範例：定時爬取蝦皮商品圖 → 向量化 → 寫進 Milvus
    pass
