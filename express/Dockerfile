# ./express/Dockerfile
FROM node:18

# 安裝必要系統套件 (Chromium / ffmpeg / 中文字體 等 Puppeteer 所需)
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

# 複製 scripts/ (包含 checkMilvus.js)，供後續容器啟動時執行
COPY scripts ./scripts

# Puppeteer：略過內建 Chromium 下載，直接用我們安裝的 /usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 只安裝 Node 依賴，不要在這裡做連線 Milvus 的動作
RUN npm install

# 複製其餘專案程式碼 (server.js, routes, models... 等)
COPY . ./

# 預設對外開放埠 3000
EXPOSE 3000

# 啟動容器時，先執行「check:milvus」(內含重試) => 確認 Milvus 就緒 => 再 npm start
CMD ["/bin/bash", "-c", "npm run check:milvus && npm start"]
