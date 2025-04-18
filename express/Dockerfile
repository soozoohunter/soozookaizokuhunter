# Node.js Alpine 版
FROM node:18-alpine

# 設定工作目錄
WORKDIR /app

# 先複製 package.json / package-lock.json，安裝 production 相依（不安裝 devDependencies）
COPY package*.json ./
RUN npm install --omit=dev \
    && npm install web3

# 複製其餘原始碼
COPY . .

# 對外暴露應用埠
EXPOSE 3000

# 啟動 Express 應用
CMD ["npm", "start"]
