# express/Dockerfile (Node.js 最終升級版)

# [FIX] 將基礎映像從 Node.js 18 升級到 20，以符合依賴套件的建議
FROM node:20-slim

# 安裝 tini，一個輕量級的 init 系統，用於正確處理信號和殭屍進程
RUN apt-get update && apt-get install -y --no-install-recommends \
    tini curl \
    && rm -rf /var/lib/apt/lists/*

# 設定工作目錄
WORKDIR /app

# 優先複製 package.json 以利用 Docker 快取機制
# 只有在 package.json 變更時，才會重新執行 npm install
COPY package*.json ./

# 安裝所有生產環境依賴
RUN npm install --omit=dev

# 複製所有應用程式程式碼
COPY . .

# 將 tini 設置為容器的進入點
ENTRYPOINT ["/usr/bin/tini", "--"]

# 預設執行的指令 (會被 docker-compose.yml 中的 command 覆蓋)
CMD ["node", "server.js"]
