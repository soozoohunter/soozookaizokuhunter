FROM ethereum/client-go:v1.12.0

WORKDIR /data

# 請確認下方三個檔案在 geth/ 裡都存在
COPY genesis.json /genesis.json
COPY init.sh /init.sh
COPY password.txt /data/password.txt

RUN chmod +x /init.sh

ENTRYPOINT ["/init.sh"]
