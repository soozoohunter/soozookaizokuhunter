# 使用 node:18-slim 作為基底映像
FROM node:18-slim

# 避免 apt-get 時互動式提示
ENV DEBIAN_FRONTEND=noninteractive

# 一次安裝所有需要的套件 (build-essential, netcat-openbsd, libpq-dev, python3-dev 等)
RUN apt-get update && apt-get install -y \
    build-essential \
    netcat-openbsd \
    libpq-dev \
    python3-dev \
  && rm -rf /var/lib/apt/lists/*

# 設定容器內的工作目錄
WORKDIR /app

# 複製 package.json (若有 package-lock.json 一併複製) 並安裝相依套件
COPY package.json ./
# 若有 package-lock.json，建議：
# COPY package*.json ./

RUN npm install

# 複製全部程式碼
COPY . .

# 建置 React 前端
RUN npm run build

# 安裝 serve 用於提供靜態檔案
RUN npm install -g serve

# 對外開放埠 3000
EXPOSE 3000

# 以 serve 提供 build 完成之 React 靜態檔案
CMD ["serve", "-s", "build", "-l", "3000"]
