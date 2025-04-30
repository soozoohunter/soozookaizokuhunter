# =========================================
# Dockerfile（位於 ./express 目錄下）
# =========================================
FROM node:18

# 安裝系統必要套件 (chromium + ffmpeg + 中文字體 + puppeteer 依賴)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium ffmpeg fonts-liberation fonts-noto-cjk \
    libatk-bridge2.0-0 libx11-xcb1 libxcomposite1 libxcursor1 \
    libxi6 libxtst6 libnss3 libglib2.0-0 libxrandr2 libatk1.0-0 \
    libdrm2 libgbm1 libpangocairo-1.0-0 libasound2 \
    iputils-ping dnsutils curl vim \
  && rm -rf /var/lib/apt/lists/*

# 設定工作目錄
WORKDIR /app

# 複製 package.json、package-lock.json (若有)
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製專案其他檔案 (server.js、routes、models、services 等)
COPY . .

# Puppeteer: 使用系統內建 Chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 開放 port 3000
EXPOSE 3000

# 啟動應用程式
CMD ["npm", "start"]
