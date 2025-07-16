# syntax=docker/dockerfile:1

########## 1️⃣ Build Stage ###############################################
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
# [★★ 關鍵修正 ★★] 移除 source-map 參數，直接 build
RUN npm run build

########## 2️⃣ Production Stage ##########################################
FROM nginx:alpine

# 將 build 好的靜態檔案複製到 nginx
COPY --from=builder /app/build /usr/share/nginx/html

# 複製 Nginx 設定檔
# 請確保你的 compose file 正確掛載了你想用的設定檔 (例如 suzoo.conf)
# 這行可以當作備用
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
