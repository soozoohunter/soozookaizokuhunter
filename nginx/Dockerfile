FROM nginx:1.25-alpine

# 安装必要工具
RUN apk add --no-cache curl netcat-openbsd

# 复制并修正脚本行尾符
COPY wait-for-it.sh /wait-for-it.sh
COPY nginx.conf /etc/nginx/nginx.conf

# 设置权限和行尾符
RUN chmod +x /wait-for-it.sh && \
    sed -i 's/\r$//' /wait-for-it.sh

CMD ["sh", "-c", "/wait-for-it.sh crawler:8081 --timeout=30 --strict -- nginx -g 'daemon off;'"]
