FROM python:3.10-alpine

# 安裝必要套件 (curl, gcc, musl-dev 等)
RUN apk add --no-cache gcc musl-dev curl bash

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
