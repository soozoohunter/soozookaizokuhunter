FROM nginx:1.27.4-alpine

# 刪除官方預設的 default.conf，免得和我們自訂檔案打架
RUN rm -f /etc/nginx/conf.d/default.conf

# 不在這裡 COPY conf；我們用 docker-compose volumes 挂載 suzoo.conf
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
