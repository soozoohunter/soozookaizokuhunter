FROM nginx:1.27.4-alpine

# 移除任何預設配置檔案
RUN rm -f /etc/nginx/conf.d/*

# 將 default.conf 複製進容器
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
