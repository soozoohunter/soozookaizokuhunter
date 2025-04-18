# express/Dockerfile

FROM node:18-alpine

WORKDIR /app

# 複製 package.json / package-lock.json 並安裝依賴
COPY package*.json ./

# 安裝所有依賴 (包含 web3)
RUN npm install

# 若 package.json 中尚無 web3，可手動補一行：
# RUN npm install web3

# 複製 Express 專案程式碼
COPY . .

# 對外暴露 3000 埠
EXPOSE 3000

# 指定啟動指令 (假設您的主程式為 server.js)
CMD ["node", "server.js"]
