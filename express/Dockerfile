# express/Dockerfile
FROM node:16-alpine

WORKDIR /app

# 1) 安裝 ffmpeg (alpine 套件)
RUN apk add --no-cache ffmpeg

# 2) 安裝 Puppeteer 所需的瀏覽器依賴 (chromium, nss, freetype, harfbuzz 等)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont
    # 若仍有錯誤，可以再加其他依賴 (mesa-gl, libxi, gconf, etc)

# 3) 复制並安裝 Node.js 依赖
COPY package*.json ./
RUN npm install

# 4) 若有字體 (如 fonts 資料夾)，可以复制
COPY ./fonts /app/fonts

# 5) 複製其餘 express 專案檔案
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
