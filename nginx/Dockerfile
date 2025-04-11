# 例如檔案路徑: nginx/Dockerfile
FROM nginx:alpine

# 1) 刪除官方預設的 default.conf (或全部 .conf 皆可)
RUN rm -f /etc/nginx/conf.d/default.conf

# 2) 複製我們自己的 default.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# 3) (可選) 如果有需要 ssl_dhparam，可放這裡
# COPY dhparam.pem /etc/nginx/dhparam.pem

# 4) Expose 非必填，容器會用 80 / 443
EXPOSE 80 443

# Nginx 預設 CMD 即可
