# Dockerfile
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

# 若您使用 ffmpeg-static + fluent-ffmpeg，可改在 package.json 內安裝即可
# 這裡系統層安裝 ffmpeg，讓您可以在 execSync("ffmpeg ...") 時呼叫到
# (若全部改用 ffmpeg-static，就可省略 apt-get install ffmpeg)

# 複製 package.json + package-lock.json 並安裝
COPY package*.json ./
RUN npm install

# 複製剩餘專案檔案
COPY . .

# Puppeteer 預設會下載自身 Chromium，但若要沿用 apt 安裝好的 /usr/bin/chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true

EXPOSE 3000
CMD ["npm","run","start"]
