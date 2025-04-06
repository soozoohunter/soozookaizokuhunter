FROM node:18-slim

WORKDIR /app


COPY package.json ./
RUN npm install

# 複製所有專案檔案到容器內
COPY . .

# 建置 React 專案（產生 production 的 build 資料夾）
RUN npm run build

# 安裝全域的 serve 套件用以啟動 production build
RUN npm install -g serve

# 對外開放 3000 埠
EXPOSE 3000

# 啟動指令：使用 serve 提供 build 資料夾內容
CMD ["serve", "-s", "build", "-l", "3000"]
