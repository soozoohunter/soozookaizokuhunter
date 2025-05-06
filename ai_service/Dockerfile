# kaiShield/ai_service/Dockerfile

FROM python:3.9

# 安裝必要套件 (含 opencv)
RUN apt-get update && apt-get install -y libgl1-mesa-glx

WORKDIR /app

# 複製需求檔
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 複製程式碼
COPY . /app

EXPOSE 5000

CMD ["python", "server.py"]
