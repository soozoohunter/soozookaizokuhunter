FROM ethereum/client-go:v1.13.5

# 建立 geth 使用者（提高安全性）
RUN addgroup -g 1000 gethuser && \
    adduser -u 1000 -G gethuser -D gethuser

WORKDIR /geth

# 複製所有所需檔案到容器中，並設定擁有權
COPY --chown=gethuser:gethuser genesis.json /geth/genesis.json
COPY --chown=gethuser:gethuser keystore/ /geth/keystore/
COPY --chown=gethuser:gethuser password.txt /geth/password.txt
COPY --chown=gethuser:gethuser init.sh /geth/init.sh

# 設定嚴格的檔案權限
RUN chmod 0400 /geth/genesis.json && \
    chmod 0500 /geth/init.sh && \
    chmod 0400 /geth/password.txt && \
    chmod 0700 /geth/keystore

USER gethuser

# 開放必要端口
EXPOSE 8545 30303

# 設定容器啟動命令
ENTRYPOINT ["/geth/init.sh"]
