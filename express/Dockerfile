FROM node:18-slim

WORKDIR /app

# 安裝 curl (或其他需要套件)
RUN apt-get update && apt-get install -y \
    curl \
    # 如果要在同容器執行 `ipfs add`, 需安裝 ipfs CLI (可選)
    # ipfs 可能需獨立安裝, 但大部分時候是另外一個容器
    && rm -rf /var/lib/apt/lists/*

# 1) 複製 package.json & package-lock.json
COPY package*.json ./

# 2) 安裝 production 依賴 (包含 web3, sequelize, etc.)
RUN npm install --production

# 3) 複製全部程式碼 (含 contracts/, utils/, routes/)
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
