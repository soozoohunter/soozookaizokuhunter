FROM nginx:alpine

# 加入 bash (和 netcat-openbsd, curl, 若您需要wait-for-it.sh用nc等指令)
RUN apk add --no-cache bash netcat-openbsd curl

WORKDIR /etc/nginx

# 複製 wait-for-it.sh 進容器
COPY wait-for-it.sh /wait-for-it.sh

# 設為可執行
RUN chmod +x /wait-for-it.sh

# 複製 nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
EXPOSE 443

# CMD 裡面用 wait-for-it.sh
# 改用 --timeout, --strict，避免 "-t" 與 "30" 產生 "Unknown option: 30"。
CMD ["/wait-for-it.sh", "crawler:8081", "--timeout", "30", "--strict", "--", "nginx", "-g", "daemon off;"]
