# 修正：執行 npm install 並安裝缺少的 web3 套件
FROM node:18
WORKDIR /app

# 複製套件定義並安裝依賴
COPY package*.json ./
RUN npm install

# 確保安裝 web3 套件，以避免 "Cannot find module 'web3'" 錯誤
RUN npm install web3

# 複製應用程式原始碼
COPY . .

# 如果有需要，開放 Express 所使用的埠號（預設 3000）
EXPOSE 3000

# 啟動 Express 應用（假設 package.json 定義了 start 腳本）
CMD ["npm", "start"]
