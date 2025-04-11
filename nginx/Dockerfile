# 使用官方 nginx:alpine 映像
FROM nginx:1.27.4-alpine

# 先刪除掉預設設定檔
RUN rm -f /etc/nginx/conf.d/*

# 複製我們自己的 default.conf 進容器
COPY default.conf /etc/nginx/conf.d/default.conf

# 讓容器繼續使用官方 entrypoint
EXPOSE 80
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]
