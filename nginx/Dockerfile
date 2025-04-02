FROM nginx:alpine

# 安裝必要工具
RUN apk add --no-cache bash curl netcat-openbsd

# 複製設定檔
COPY nginx.conf /etc/nginx/nginx.conf
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# 等待所有依賴服務就緒後啟動 Nginx
CMD ["sh", "-c", \
  "/wait-for-it.sh suzoo_frontend:80 --timeout=300 --strict && " \
  "/wait-for-it.sh suzoo_express:3000 --timeout=300 --strict && " \
  "/wait-for-it.sh suzoo_fastapi:8000 --timeout=300 --strict && " \
  "/wait-for-it.sh suzoo_crawler:8081 --timeout=300 --strict && " \
  "nginx -g 'daemon off;'"]
