FROM node:18

WORKDIR /app

# 先複製 package.json / package-lock.json
COPY package*.json ./

# 安裝所有 dependencies（包含 web3）
RUN npm install

# 複製整個 express 原始碼
COPY . .

# 預設由 server.js 或 app.js 等檔案啟動
EXPOSE 3000

CMD ["npm", "run", "start"]
