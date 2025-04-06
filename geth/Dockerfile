FROM ethereum/client-go:stable

# 建立非 root 用戶 gethuser，並創建必要的目錄
RUN adduser -D -u 1000 gethuser && mkdir -p /geth/data/keystore

WORKDIR /geth

# 複製必要檔案到容器中
COPY genesis.json /geth/genesis.json
COPY keystore/ /geth/keystore/
COPY password.txt /geth/password.txt
COPY init.sh /geth/init.sh

# 調整檔案權限與所有權
RUN chown -R gethuser:gethuser /geth && \
    chmod 0400 /geth/genesis.json && \
    chmod 0500 /geth/init.sh && \
    chmod 0400 /geth/password.txt && \
    chmod 0700 /geth/keystore

USER gethuser

# 暴露 RPC 與 P2P 埠（如8545：RPC，30303：P2P，8546：WS若啟用）
EXPOSE 8545 30303 8546

# 設定容器入口點
ENTRYPOINT ["/bin/sh", "/geth/init.sh"]
