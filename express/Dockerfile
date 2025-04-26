# express/Dockerfile
FROM node:16-alpine

WORKDIR /app

# 1) 安裝 ffmpeg、Chromium 等 Puppeteer 所需依賴
RUN apk add --no-cache ffmpeg \
  && apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

# 2) 複製並安裝 Node.js 依賴
COPY package*.json ./
RUN npm install

# 3) 複製 fonts/ 與 public/ 資料夾到 /app (確保本機端有這些資料夾)
COPY ./fonts /app/fonts
COPY ./public /app/public

# 4) 複製其餘 express 專案檔案（routes, utils, server.js, ...）
COPY . .

# 5) 暴露 port 3000
EXPOSE 3000

# 6) 以 node server.js 執行
CMD ["node", "server.js"]
