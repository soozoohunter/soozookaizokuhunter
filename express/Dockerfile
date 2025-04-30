FROM node:18

# 1) 安裝必要系統套件 (含 Chromium、ffmpeg、中文字體、等 puppeteer 所需依賴)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium ffmpeg fonts-liberation fonts-noto-cjk \
    libatk-bridge2.0-0 libx11-xcb1 libxcomposite1 libxcursor1 \
    libxi6 libxtst6 libnss3 libglib2.0-0 libxrandr2 libatk1.0-0 \
    libdrm2 libgbm1 libpangocairo-1.0-0 libasound2 \
    iputils-ping dnsutils curl vim \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2) 複製 package.json / package-lock.json (若有)
COPY package*.json ./

# 3) 安裝依賴
RUN npm install

# 4) 複製專案所有檔案 (包含 server.js、routes、models、.env、uploads、等)
COPY . .

# 告知 puppeteer 不要再下載 Chrome binary，而是用我們裝的 /usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 監聽 3000 port (若 server.js 監聽 3000)
EXPOSE 3000

# 5) 容器啟動時，跑 "npm start" (即 "node server.js")
CMD ["npm", "start"]
