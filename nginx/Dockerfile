# nginx/Dockerfile

FROM nginx:alpine

# 1) 複製 wait-for-it.sh 到容器內
COPY wait-for-it.sh /wait-for-it.sh

# 2) 賦予可執行權 (若您已在宿主機chmod +x，也可再安全保險一次)
RUN chmod +x /wait-for-it.sh

# 3) 複製您的自訂 nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf

# 4) 對外開放 80,443
EXPOSE 80
EXPOSE 443

# 5) 以 wait-for-it.sh 等待 crawler:8081 就緒後再執行 nginx
CMD ["/wait-for-it.sh", "crawler:8081", "--timeout=30", "--strict", "--", "nginx", "-g", "daemon off;"]
