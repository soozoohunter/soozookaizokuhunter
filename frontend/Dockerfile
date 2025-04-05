FROM node:18-alpine

WORKDIR /app

# 複製 package.json 及 package-lock.json (或 yarn.lock)
COPY package*.json ./

RUN npm install

# 複製所有專案檔案到容器中
COPY . .

# 執行建構
RUN npm run build

# 若有需要，可設定啟動命令，例如使用 nginx 來提供靜態檔案
# CMD ["npx", "serve", "build"]