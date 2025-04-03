FROM ethereum/client-go:v1.12.0
WORKDIR /data

# 複製 init.sh, genesis.json
COPY init.sh /init.sh
COPY genesis.json /genesis.json

# 複製 keystore資料夾 & password檔
COPY keystore /data/keystore
COPY password.txt /data/password.txt

RUN chmod +x /init.sh

ENTRYPOINT ["/init.sh"]
