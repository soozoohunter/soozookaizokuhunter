# express/Dockerfile
FROM node:18

# 安裝基本系統套件 (含 chromium、x11、fonts 等)
RUN apt-get update && apt-get install -y \
  wget gnupg2 ca-certificates apt-transport-https \
  libx11-6 libx11-xcb1 libxcomposite1 libxcursor1 libxi6 \
  libxtst6 libnss3 libglib2.0-0 libxrandr2 libatk1.0-0 \
  libatk-bridge2.0-0 libdrm2 libgbm1 libpangocairo-1.0-0 \
  libasound2 libpng-dev libfontconfig1 fonts-liberation \
  ffmpeg \
  chromium \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1) 複製 package.json + package-lock.json => 並安裝所有依賴 (含 fluent-ffmpeg)
COPY package*.json ./
RUN npm install

# 2) 複製剩餘程式
COPY . .

# Puppeteer 設定：使用系統 /usr/bin/chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true

EXPOSE 3000

CMD ["npm","run","start"]
