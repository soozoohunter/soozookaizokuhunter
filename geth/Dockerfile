FROM ethereum/client-go:stable

# 建立非 root 用戶 gethuser 並建立必要目錄
RUN adduser -D -u 1000 gethuser && mkdir -p /geth/data/keystore

WORKDIR /geth

# 複製 genesis.json、keystore、password.txt 與 init.sh 到容器中
COPY genesis.json /geth/genesis.json
COPY keystore/ /geth/keystore/
COPY password.txt /geth/password.txt
COPY init.sh /geth/init.sh

# 調整檔案權限與所有權
RUN chown -R gethuser:gethuser /geth && \
    chmod 0400 /geth/genesis.json && \
    chmod 0500 /geth/init.sh && \
    chmod 0400 /geth/password.txt && \
    chmod -R 0700 /geth/keystore

USER gethuser

# 暴露必要端口
EXPOSE 8545 8546 30303

ENTRYPOINT ["/bin/sh", "/geth/init.sh"]
