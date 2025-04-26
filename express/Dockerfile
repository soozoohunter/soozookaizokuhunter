# ...
WORKDIR /app

# 1) 安裝 ffmpeg + chromium
RUN apk add --no-cache ffmpeg \
    && apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

# 2) 複製 package.json + 安裝
COPY package*.json ./
RUN npm install

# 3) 複製 fonts/ → /app/fonts
COPY ./fonts /app/fonts

# 4) 複製 public/ → /app/public
COPY ./public /app/public

# 5) 複製其餘檔案
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
