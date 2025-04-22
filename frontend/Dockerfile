#############################
# 1) Builder Stage
#############################
FROM node:16-alpine AS builder
WORKDIR /app

# 複製 package.json、package-lock.json
COPY package*.json ./
# 安裝依賴
RUN npm install

# 複製整個前端專案
COPY . .

# ※ 建議在 package.json 中確認 "build" script 存在
RUN npm run build

#############################
# 2) Production Stage
#############################
FROM node:16-alpine

# 安裝 serve 用於靜態檔
RUN npm install -g serve

WORKDIR /app
# 從 builder 階段複製打包後的 build 目錄
COPY --from=builder /app/build ./build

EXPOSE 3000
# 使用 serve -s build 監聽 3000埠
CMD ["serve", "-s", "build", "-l", "3000"]
