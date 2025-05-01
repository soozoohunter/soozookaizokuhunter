# ./express/Dockerfile
FROM node:18

# 安裝必要系統套件 (Chromium / ffmpeg / 中文字體 等 Puppeteer 依賴)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium ffmpeg fonts-liberation fonts-noto-cjk \
    libatk-bridge2.0-0 libx11-xcb1 libxcomposite1 libxcursor1 \
    libxi6 libxtst6 libnss3 libglib2.0-0 libxrandr2 libatk1.0-0 \
    libdrm2 libgbm1 libpangocairo-1.0-0 libasound2 \
    iputils-ping dnsutils curl vim \
  && rm -rf /var/lib/apt/lists/*

# 設定工作目錄
WORKDIR /app

# 先複製 package.json / package-lock.json（若有）
COPY package*.json ./

# 確保 scripts/checkMilvus.js 被複製，雖然我們不在 build 時執行，但容器啟動時會用到
COPY scripts ./scripts

# Puppeteer 不要下載內建 Chromium，直接用系統安裝的 /usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 這邊只做依賴安裝，**不進行 check:milvus**，以免 DNS 不到 suzoo_milvus
RUN npm install

# 複製其餘原始碼 (server.js, routes, models... 等)
COPY . ./

# Docker 容器預設開放的 port
EXPOSE 3000

# ★ 容器啟動時：先 npm run check:milvus (此時 Docker Compose 已啟動 suzoo_milvus, DNS 正常)
CMD ["/bin/bash", "-c", "npm run check:milvus && npm start"]
