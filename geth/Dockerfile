FROM ethereum/client-go:v1.12.0
WORKDIR /data

# 只複製 genesis.json、init.sh、password.txt
COPY genesis.json /genesis.json
COPY init.sh /init.sh
COPY password.txt /data/password.txt

RUN chmod +x /init.sh

ENTRYPOINT ["/init.sh"]
