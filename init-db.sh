#!/bin/bash
set -e

PGDATA="/var/lib/postgresql/data"

# 直接硬編碼（含私密資訊）
DB_USER="postgres"
DB_PASS="KaiShieldDbPass123"
DB_NAME="kaishield_db"

POSTGRES_BIN="/usr/lib/postgresql/15/bin/postgres"
INITDB_BIN="/usr/lib/postgresql/15/bin/initdb"
PG_CTL_BIN="/usr/lib/postgresql/15/bin/pg_ctl"

mkdir -p $PGDATA
chown -R postgres:postgres $PGDATA

# 若資料夾尚未初始化則執行
if [ ! -f "$PGDATA/PG_VERSION" ]; then
    echo "===> 初始化 PostgreSQL 資料夾"
    su postgres -c "$INITDB_BIN -D $PGDATA"

    # 僅在本容器內監聽
    echo "listen_addresses='127.0.0.1'" >> $PGDATA/postgresql.conf
    echo "host all all 127.0.0.1/32 md5" >> $PGDATA/pg_hba.conf

    su postgres -c "$PG_CTL_BIN start -D $PGDATA -o \"-c listen_addresses='127.0.0.1'\" -w"

    su postgres -c "psql -c \"CREATE USER $DB_USER WITH SUPERUSER PASSWORD '$DB_PASS';\""
    su postgres -c "createdb -O $DB_USER $DB_NAME"

    su postgres -c "$PG_CTL_BIN stop -D $PGDATA"
fi

rm -f $PGDATA/postmaster.pid

echo "===> 以前台模式啟動 PostgreSQL..."
exec su postgres -c "$POSTGRES_BIN -D $PGDATA"
