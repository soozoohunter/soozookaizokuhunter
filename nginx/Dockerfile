FROM nginx:1.27.4-alpine

# 1) 刪除官方預設 default.conf，避免多餘設定衝突
RUN rm -f /etc/nginx/conf.d/default.conf

# 2) 不在這裡 COPY default.conf，因為我們用 docker-compose volumes :ro 去掛載
# COPY default.conf /etc/nginx/conf.d/default.conf

# (可選) EXPOSE 80 443
EXPOSE 80 443

# 預設 CMD 就是 "nginx -g daemon off;"
