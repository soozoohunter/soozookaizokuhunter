# syntax=docker/dockerfile:1

########## 1️⃣ Build Stage ###############################################
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

########## 2️⃣ Production Stage ##########################################
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html

# [★★ 關鍵修正 ★★] 修正 Nginx 設定檔的複製路徑
# Docker build 的 context 是 ./frontend，所以路徑要從 nginx/ 開始
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
