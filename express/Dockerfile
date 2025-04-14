# express/Dockerfile
FROM node:18-alpine

# 建置時的工作目錄
WORKDIR /usr/src/app

# 先複製 package*.json
COPY package*.json ./

# 執行 npm install
RUN npm install

# 再複製全部源碼
COPY . .

# 開放埠 (非對外, 給 docker-compose 用)
EXPOSE 3000

# 預設啟動指令
CMD ["node", "server.js"]
