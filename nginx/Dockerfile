FROM nginx:alpine

RUN apk add --no-cache bash netcat-openbsd curl

WORKDIR /etc/nginx

# 複製 wait-for-it.sh
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# 複製自訂的 nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
EXPOSE 443

# CMD：先後等待 express:3000, fastapi:8000, crawler:8081
# 時間拉到 300 秒，避免大規模啟動延遲
CMD [
  "sh",
  "-c",
  "/wait-for-it.sh express:3000 --timeout=300 --strict && \
   /wait-for-it.sh fastapi:8000 --timeout=300 --strict && \
   /wait-for-it.sh crawler:8081 --timeout=300 --strict && \
   nginx -g 'daemon off;'"
]
