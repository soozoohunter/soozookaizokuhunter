# express/Dockerfile
FROM node:18-slim

WORKDIR /app

# 安裝必要工具 (如 curl)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# 複製 package.json / package-lock.json
COPY package*.json ./

# 安裝生產環境依賴
RUN npm install --production

# 複製全部程式碼 (含 routes/, utils/, contracts/, server.js)
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
