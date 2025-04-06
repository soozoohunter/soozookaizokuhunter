FROM node:18-slim

# 更新 apt-get 並安裝必要的套件
RUN apt-get update && apt-get install -y \
    build-essential \        # 編譯工具 (包含 gcc, make)
    netcat-openbsd \           # netcat 工具
    libpq-dev \                # PostgreSQL 開發庫
    python3-dev               # Python 開發頭文件

WORKDIR /app

# 複製 package.json 與 package-lock.json（如果存在）
COPY package.json package-lock.json* ./
RUN npm install

# 複製所有專案檔案到容器內
COPY . .

# 建置 React 專案（產生 production 的 build 資料夾）
RUN npm run build

# 安裝全域 serve 套件用以啟動 production build
RUN npm install -g serve

# 對外開放 3000 埠
EXPOSE 3000

# 啟動指令：使用 serve 提供 build 資料夾內容
CMD ["serve", "-s", "build", "-l", "3000"]
