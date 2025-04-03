FROM ethereum/client-go:v1.12.0
WORKDIR /data

# 复制必要文件
COPY init.sh /init.sh
COPY genesis.json /genesis.json
COPY keystore/ /data/keystore/
COPY password.txt /data/password.txt

# 设置权限
RUN chmod +x /init.sh && \
    chmod 644 /data/password.txt && \
    chmod 600 /data/keystore/*

ENTRYPOINT ["/init.sh"]
