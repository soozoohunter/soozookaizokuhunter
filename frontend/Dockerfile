# frontend/Dockerfile

FROM node:18-slim

# 關鍵環境變數：跳過 ESLint 檢查
ENV DISABLE_ESLINT_PLUGIN=true

WORKDIR /app

# 安裝系統需求 (例如 curl)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*


COPY package.json ./

RUN npm install

# 複製前端原始碼
COPY . .

# 建置 React 專案 (執行 npm run build，會自動跳過 ESLint)
RUN npm run build

# 全域安裝 serve (用於提供 build 資料夾的靜態檔服務)
RUN npm install -g serve

# 對外開放 3000 埠
EXPOSE 3000

# 預設執行指令
CMD ["serve", "-s", "build", "-l", "3000"]
