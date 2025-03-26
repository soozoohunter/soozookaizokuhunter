# Dockerfile - 單容器整合 PostgreSQL + Redis + Express + FastAPI + Nginx + Supervisord
FROM python:3.10-slim

# ========== 1) 安裝系統套件與必要工具 ==========
RUN apt-get update && apt-get install -y \
    curl \
    gnupg2 \
    nano \
    postgresql-15 \
    postgresql-client-15 \
    postgresql-contrib \
    redis-server \
    supervisor \
    nginx \
    build-essential \
    netcat-openbsd \
    libpq-dev \
    python3-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ========== 2) 安裝 Node.js 18 ==========
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get update && apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# ========== 3) 建立必要資料夾 & 權限設定 ==========
RUN mkdir -p /var/lib/postgresql/data /var/lib/redis /var/lib/nginx /var/log/nginx && \
    chown -R postgres:postgres /var/lib/postgresql/data && \
    chown -R www-data:www-data /var/lib/nginx /var/log/nginx

# ========== 4) 宣告 Volume (讓資料持久化) ==========
VOLUME /var/lib/postgresql/data
VOLUME /var/lib/redis

# ========== 5) WORKDIR 與預先複製依賴檔案 ==========
WORKDIR /app
COPY express/package*.json ./express/
COPY fastapi/requirements.txt ./fastapi/

# ========== 6) 安裝 Express 依賴 ==========
WORKDIR /app/express
RUN npm install --omit=dev

# ========== 7) 安裝 FastAPI 依賴 ==========
WORKDIR /app/fastapi
RUN pip install --no-cache-dir -r requirements.txt

# ========== 8) 複製其他檔案到 /app ==========
WORKDIR /app
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY init-db.sh /app/init-db.sh
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# ========== 9) 複製應用程式碼 ==========
COPY express/ ./express/
COPY fastapi/ ./fastapi/

# ========== 10) 設定可執行權限 ==========
RUN chmod +x /app/init-db.sh

# ========== 11) 移除 Nginx 預設設定 ==========
RUN rm -f /etc/nginx/sites-enabled/default

# ========== 12) 暴露對外 Port 80 ==========
EXPOSE 80

# ========== 13) 健康檢查 ==========
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD nc -z localhost 5432 && nc -z localhost 6379 && curl -f http://localhost/express/ || exit 1

# ========== 14) 以 supervisor 控制多服務 ==========
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
