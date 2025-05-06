FROM python:3.9

# 安裝必要套件 (含 opencv)
RUN apt-get update && apt-get install -y libgl1-mesa-glx

WORKDIR /app

# 複製需求檔
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# 複製程式碼
COPY . /app

EXPOSE 5000

# 改用 Gunicorn 啟動 Flask (適合生產環境)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "server:app"]
