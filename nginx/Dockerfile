FROM nginx:1.27.4-alpine

# 移除任何預設配置檔
RUN rm -f /etc/nginx/conf.d/*

# 把你要用的 default.conf 複製到容器裡
COPY default.conf /etc/nginx/conf.d/default.conf

# 這裡若你需要其它設定，也可自行新增
# ...

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
