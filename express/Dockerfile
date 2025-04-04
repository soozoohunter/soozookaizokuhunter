FROM node:18-alpine

WORKDIR /app

# 複製 package.json & package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install --production && npm cache clean --force

# 複製源碼
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
