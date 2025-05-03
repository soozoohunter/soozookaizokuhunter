# 使用 node 18 作為基底
FROM node:18

# 安裝必要的系統套件 (Chromium / ffmpeg / 字體 / puppeteer 依賴等)
# 這些套件可以參考 puppeteer 官方文件 (包含 fonts、必要的 lib 等) 
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ffmpeg \
    fonts-liberation \
    fonts-noto-cjk \
    libatk-bridge2.0-0 \
    libasound2 \
    libatk1.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxi6 \
    libxtst6 \
    libnss3 \
    libglib2.0-0 \
    libxrandr2 \
    libdrm2 \
    libgbm1 \
    libpangocairo-1.0-0 \
    iputils-ping \
    dnsutils \
    curl \
    vim \
    bash \
  && rm -rf /var/lib/apt/lists/*

# 設定工作目錄
WORKDIR /app

# 先複製 package.json / package-lock.json (若有) 至容器
COPY package*.json ./

# 設定 puppeteer 跳過下載內建Chromium，使用系統安裝的 /usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 安裝 Node.js 依賴
RUN npm install

# 複製其餘程式碼到 /app
COPY . ./

# 預先建立 debugShots 資料夾（存放截圖）
RUN mkdir -p /app/debugShots

# 開放容器 3000 port
EXPOSE 3000

# 預設啟動指令
CMD ["npm", "start"]
