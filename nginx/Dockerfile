# 使用體積更小的 Alpine 版 Nginx
FROM nginx:alpine

# 移除預設設定檔
RUN rm /etc/nginx/conf.d/default.conf

# 直接拷貝自訂配置（如果您沒有用 volumes，也可在這裡 COPY）
# 這裡不另做 rename，保持您原先的 suzoo.conf
