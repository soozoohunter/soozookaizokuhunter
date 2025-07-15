# syntax=docker/dockerfile:1
########## 1️⃣ Build Stage ###############################################
FROM node:18-alpine AS builder

WORKDIR /app

# 先複製 package* 以便快取 install 步驟
COPY package.json package-lock.json ./
# Ensure lock file is in sync with package.json
RUN npm install --package-lock-only && \
    npm ci --legacy-peer-deps

# 再複製其餘原始碼
COPY . .

# 將後端 API 位址在建置期注入；預設為 dev 值
ARG REACT_APP_API_URL=http://localhost:3000
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# 產生正式版靜態檔
RUN npm run build

########## 2️⃣ Production Stage ##########################################
FROM nginx:alpine

# 將 React build 產物放進 Nginx 預設靜態目錄
COPY --from=builder /app/build /usr/share/nginx/html

# 使用自定義的 nginx.conf 以啟用 API 代理
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
