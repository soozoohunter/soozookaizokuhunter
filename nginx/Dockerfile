FROM nginx:1.25-alpine

# 安裝必要工具 (Alpine 使用 apk)
RUN apk add --no-cache curl

# 複製配置與腳本
COPY nginx.conf /etc/nginx/nginx.conf
COPY wait-for-it.sh /wait-for-it.sh

# 設定腳本權限與行尾符 (必須使用 LF)
RUN chmod +x /wait-for-it.sh && \
    sed -i 's/\r$//' /wait-for-it.sh

# 預設啟動指令
CMD ["nginx", "-g", "daemon off;"]
