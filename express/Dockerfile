FROM node:18

WORKDIR /app


COPY package*.json ./

# 安裝依賴(包含 web3)
# 如果您已將 "web3" 加入 package.json 的 dependencies，這一條 RUN 就會自動安裝
# 若尚未加入，可手動: RUN npm install && npm install web3
RUN npm install

# 複製整個 express 原始碼
COPY . .

# 預設由 server.js 或 app.js 等檔案啟動
EXPOSE 3000

CMD ["npm", "run", "start"]
