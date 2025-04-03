FROM ethereum/client-go:v1.12.0
WORKDIR /data

COPY init.sh /init.sh
COPY genesis.json /genesis.json
# 如果有 password.txt 也一併 COPY
# COPY password.txt /data/password.txt

RUN chmod +x /init.sh

ENTRYPOINT ["/init.sh"]
