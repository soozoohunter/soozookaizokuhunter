# express/Dockerfile
FROM node:16-alpine

WORKDIR /app

# 1) 安裝 ffmpeg, Chromium, 等 Puppeteer 依賴
RUN apk add --no-cache ffmpeg \
  && apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

# 2) 複製並安裝 Node.js 依賴
COPY package*.json ./
RUN npm install

# 3) 複製字體 (fonts) => /app/fonts
COPY ./fonts /app/fonts
# 若您有 public/stamp.png => 複製
COPY ./public /app/public

# 4) 複製其餘 express (routes, utils, server.js, etc.)
COPY . .

# 5) 暴露 port
EXPOSE 3000

# 6) 啟動
CMD ["node", "server.js"]
