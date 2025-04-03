FROM ethereum/client-go:v1.12.0
WORKDIR /data

COPY init.sh /init.sh
COPY genesis.json /genesis.json

# 複製 keystore 與 password.txt
# keystore/ 內含 2 個檔案:
#  UTC--2025-04-03T08-00-02...--034f9688de6bf5709da5c258b3825cb01c5ae475
#  UTC--2025-04-03T13-29-11...--c8f98636ebb10dbcb216026db3dab527cf37c2ee
COPY keystore /data/keystore
COPY password.txt /data/password.txt

RUN chmod +x /init.sh

ENTRYPOINT ["/init.sh"]
