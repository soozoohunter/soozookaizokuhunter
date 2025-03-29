FROM python:3.10-slim

WORKDIR /app

# 若你需要系統依賴，可取消註解
# RUN apt-get update && apt-get install -y build-essential libssl-dev libffi-dev \
#     && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
