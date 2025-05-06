FROM python:3.9-slim

WORKDIR /app

# 安裝所需套件，先複製 requirements.txt 再安裝
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 複製所有原始碼
COPY . .

EXPOSE 8000

# 最後啟動指令，如有變動(例如app.py不一樣)請自行調整
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
