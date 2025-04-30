# Dockerfile placed under: ./express/Dockerfile

FROM node:18

# 1) 安裝系統必要套件 (chromium + ffmpeg + 中文字體 + puppeteer 依賴)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium ffmpeg fonts-liberation fonts-noto-cjk \
    libatk-bridge2.0-0 libx11-xcb1 libxcomposite1 libxcursor1 \
    libxi6 libxtst6 libnss3 libglib2.0-0 libxrandr2 libatk1.0-0 \
    libdrm2 libgbm1 libpangocairo-1.0-0 libasound2 \
    iputils-ping dnsutils curl vim \
  && rm -rf /var/lib/apt/lists/*

# 2) 設定工作目錄
WORKDIR /app

# 3) 複製 package.json、package-lock.json (若有)
COPY package*.json ./

# 4) 安裝依賴
RUN npm install

# (可選) 調試：確保我們安裝完之後的 package.json 確實帶有 "start" 腳本
# RUN cat package.json

# 5) 複製專案其他檔案 (包含 server.js、routes、models 等)
COPY . .

# Puppeteer: 指定使用系統安裝的 Chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 6) 若您的 server.js 監聽 3000 => EXPOSE 3000
EXPOSE 3000

# 7) 容器啟動執行 => 一定要有 CMD ["npm", "start"]
CMD ["npm", "start"]
