 # ========== 1) 建置階段：用 node:18 建置 React ==========
FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ========== 2) 部署階段：用 nginx:alpine 發佈 /usr/share/nginx/html ==========
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
# 若需自訂 Nginx 配置: 
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
