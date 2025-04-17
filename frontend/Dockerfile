FROM node:18-slim

WORKDIR /app

# 複製 package.json / package-lock.json
COPY package*.json ./

RUN npm install

# 複製所有前端原始碼
COPY . .

# 建置 (build) React
RUN npm run build

# 安裝 serve，容器內以 serve 启动靜態檔
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
