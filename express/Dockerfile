# Dockerfile 範例
FROM node:18

# 安裝基本系統套件 (含 chromium、x11、fonts 等)
RUN apt-get update && apt-get install -y \
  wget gnupg2 ca-certificates apt-transport-https \
  libx11-6 libx11-xcb1 libxcomposite1 libxcursor1 libxi6 \
  libxtst6 libnss3 libglib2.0-0 libxrandr2 libatk1.0-0 \
  libatk-bridge2.0-0 libdrm2 libgbm1 libpangocairo-1.0-0 \
  libasound2 libpng-dev \
  chromium

# 安裝你的專案依賴
WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# Puppeteer 預設會去下載 chrome，但若要沿用系統 chromium，可在環境變數指定
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 3000
CMD ["npm","run","start"]
