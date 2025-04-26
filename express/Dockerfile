# express/Dockerfile

FROM node:16-alpine

WORKDIR /app

# 1) 安裝 ffmpeg (for 抽幀)、安裝 Puppeteer 所需的瀏覽器依賴 (chromium, nss, freetype, harfbuzz, etc)
RUN apk add --no-cache ffmpeg \
    && apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

# 2) 複製並安裝 Node.js 依賴
COPY package*.json ./
RUN npm install

# 3) 若有字體 (如 fonts 資料夾) 則可複製
COPY ./fonts /app/fonts

# 4) 複製其餘 express 專案檔案
#    若無 .dockerignore 排除檔案，這行會把 express/utils, express/services, express/routes... 等都帶進去
COPY . .

# 5) 開放對外 port
EXPOSE 3000

# 6) 以 node server.js 啟動
CMD ["node", "server.js"]
