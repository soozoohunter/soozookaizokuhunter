# ./express/Dockerfile
FROM node:18

# 安裝必要系統套件 (包含 Chromium / ffmpeg / 中文字體 等 Puppeteer 依賴)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium ffmpeg fonts-liberation fonts-noto-cjk \
    libatk-bridge2.0-0 libx11-xcb1 libxcomposite1 libxcursor1 \
    libxi6 libxtst6 libnss3 libglib2.0-0 libxrandr2 libatk1.0-0 \
    libdrm2 libgbm1 libpangocairo-1.0-0 libasound2 \
    iputils-ping dnsutils curl vim \
  && rm -rf /var/lib/apt/lists/*

# 設定工作目錄
WORKDIR /app

# 先複製 package.json / package-lock.json
COPY package*.json ./

# 若確定 scripts/ 裡面就只有 checkMilvus.js，且需要在 npm install 前就能讀到
# 就一併複製過來，確保 postinstall 找得到它
COPY scripts ./scripts

# 告知 Puppeteer 不要再下載內建 Chromium，直接用系統的 /usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 安裝 Node 套件依賴
RUN npm install

# 其餘所有程式檔案（server.js、routes、models...）最後再 COPY 進容器
COPY . ./

# 預設要開放的 Port
EXPOSE 3000

# 容器啟動時：先執行 npm run check:milvus（測試連線 & 建立 collection），然後啟動 Express
CMD ["/bin/bash", "-c", "npm run check:milvus && npm start"]
