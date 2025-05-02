FROM python:3.9-slim

WORKDIR /app

# 安裝 ffmpeg、libgl1，如需處理影片/顯示等
RUN apt-get update && apt-get install -y ffmpeg libgl1 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
