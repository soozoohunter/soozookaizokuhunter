# 使用 Node.js 18 作為基底
FROM node:18

# 1. 安裝必要套件 (Chromium / ffmpeg / 字體 / Puppeteer 相關依賴 / Python / OpenCV)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium ffmpeg fonts-liberation fonts-noto-cjk \
    libatk-bridge2.0-0 libx11-xcb1 libxcomposite1 libxcursor1 \
    libxi6 libxtst6 libnss3 libglib2.0-0 libxrandr2 libatk1.0-0 \
    libdrm2 libgbm1 libpangocairo-1.0-0 libasound2 \
    iputils-ping dnsutils curl vim bash \
    python3 python3-pip python3-opencv \
  && rm -rf /var/lib/apt/lists/*

# Puppeteer 設定：略過內建下載，改使用系統中安裝好的 Chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 2. 設定工作目錄
WORKDIR /app

# 3. 複製 package.json, package-lock.json 或 yarn.lock 並安裝 Node.js 依賴
COPY package*.json ./
RUN npm install

# Install Express application dependencies
COPY express/package*.json ./express/
RUN npm install --prefix ./express

# 4. 複製所有程式碼
COPY . ./

# 5. 預先建立可能需要的資料夾 (例如：/app/debugShots)
RUN mkdir -p /app/debugShots

# Set working directory to the Express app
WORKDIR /app/express

# 6. 開放埠 (Docker Container 對外服務使用的port)
EXPOSE 3000

# 7. Docker Container 啟動指令
CMD ["npm", "start"]
