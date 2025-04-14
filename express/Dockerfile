# express/Dockerfile
FROM node:18-alpine

WORKDIR /app

# 複製 package 定義並安裝相依
COPY package*.json ./
RUN npm install --omit=dev

# 複製後端源碼
COPY . .

# 開放 3000 埠
EXPOSE 3000

# 預設啟動
CMD ["node", "server.js"]
