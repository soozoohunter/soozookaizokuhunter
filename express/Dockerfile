# express/Dockerfile
FROM node:16-alpine

WORKDIR /app

# 1) 安裝 ffmpeg
RUN apk add --no-cache ffmpeg

# 2) 安裝 puppeteer 所需依賴 (chromium, nss, freetype, etc.)
RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  # 若報錯可再加 mesa-gl, libxi, gconf, etc

# 3) COPY package*.json & npm install
COPY package*.json ./
RUN npm install

# 4) COPY fonts (如果有)
COPY ./fonts /app/fonts

# 5) COPY 其餘檔案
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
