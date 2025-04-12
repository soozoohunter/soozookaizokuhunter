# 使用 Node.js 18 的輕量 Alpine 基底映像
FROM node:18-alpine

# 工作目錄為 /app
WORKDIR /app

# 複製套件定義並安裝相依 (使用 npm ci 確保一致性)
COPY package.json package-lock.json ./
RUN npm install

# 複製專案檔案並建置前端
COPY . .
RUN npm run build

# 全域安裝 serve 套件，用於提供靜態檔案
RUN npm install -g serve

# 映像內部暴露埠號 3000
EXPOSE 3000

# 預設使用 serve 提供編譯出的前端靜態檔案
CMD ["serve", "-s", "build", "-l", "3000"]
