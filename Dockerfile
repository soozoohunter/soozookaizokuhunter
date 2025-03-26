# Dockerfile - 單容器整合 PostgreSQL + Redis + Express + FastAPI + Nginx + Supervisor
# 解法 B: 保留原生 psycopg2，需要安裝 gcc/build-essential 等編譯工具

FROM python:3.10-slim

# ========== (可選) 若預設 apt source 無法安裝 postgresql-15，請取消下列區塊註解 ==========
# RUN apt-get update && apt-get install -y wget gnupg2 lsb-release
# RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" \
#     > /etc/apt/sources.list.d/pgdg.list
# RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
# ===============================================================================

# ========== 1) 安裝系統套件 (包含編譯工具, PostgreSQL 15, Redis, Nginx, Supervisor) ==========
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
    netcat-openbsd \
    libpq-dev \
    python3-dev \
    build-essential \
    gcc \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ========== 2) 安裝 Node.js 18 ==========
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get update && apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# ========== 3) 建立 PostgreSQL/Redis/Nginx 目錄 & 權限 ==========
RUN mkdir -p /var/lib/postgresql/data /var/lib/redis /var/lib/nginx /var/log/nginx && \
    chown -R postgres:postgres /var/lib/postgresql/data && \
    chown -R www-data:www-data /var/lib/nginx /var/log/nginx

# ========== 4) 宣告 Volume (保留資料) ==========
VOLUME /var/lib/postgresql/data
VOLUME /var/lib/redis

# ========== 5) 預先複製依賴檔案 (express/package.json, fastapi/requirements.txt) ==========
WORKDIR /app
COPY express/package*.json ./express/
COPY fastapi/requirements.txt ./fastapi/

# ========== 6) 安裝 Express 依賴 (Node.js) ==========
WORKDIR /app/express
RUN npm install --omit=dev

# ========== 7) 安裝 FastAPI 依賴 (python, 含原生 psycopg2) ==========
WORKDIR /app/fastapi
RUN pip install --no-cache-dir -r requirements.txt

# ========== 8) 複製其餘檔案 (supervisord.conf, init-db.sh, nginx/default.conf, 整個專案) ==========
WORKDIR /app
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY init-db.sh /app/init-db.sh
COPY nginx/default.conf /app/nginx/default.conf
COPY . .  # 複製整個 suzukaizokuhunter/ 包含 express/, fastapi/

# ========== 9) 設定可執行權限 & 移除預設 Nginx config + Link default.conf ==========
RUN chmod +x /app/init-db.sh && \
    rm -f /etc/nginx/sites-enabled/default && \
    ln -sf /app/nginx/default.conf /etc/nginx/conf.d/default.conf

# ========== 10) 對外埠 80 ==========
EXPOSE 80

# ========== 11) HEALTHCHECK (可選) ==========
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s \
  CMD nc -z localhost 5432 && nc -z localhost 6379 && curl -f http://localhost/express/ || exit 1

# ========== 12) 以 supervisor 同時啟動 (Postgres, Redis, Express, FastAPI, Nginx) ==========
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
