FROM python:3.10-slim

# 安装系统依赖（包含编译工具）
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    g++ \          # 确保 Solidity 编译器依赖
    make \         # 确保 Make 工具
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt ./

# 升级 pip 并安装依赖
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . /app
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
