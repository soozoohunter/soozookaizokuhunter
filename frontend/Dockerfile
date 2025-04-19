########################
# 1) Builder Stage
########################
FROM node:16-alpine AS build

WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝所有依賴
RUN npm install

# 複製剩餘前端程式碼
COPY . .

# 編譯成生產版本
RUN npm run build

########################
# 2) Production Stage
########################
FROM node:16-alpine AS production

# 安裝 serve 作為靜態檔案伺服器
RUN npm install -g serve

WORKDIR /app

# 從 builder 複製編譯後的檔案
COPY --from=build /app/build ./build

# 容器對外暴露 3000 埠
EXPOSE 3000

# 以 serve 啟動，提供單頁應用程式 (SPA)
CMD ["serve", "-s", "build", "-l", "3000"]
