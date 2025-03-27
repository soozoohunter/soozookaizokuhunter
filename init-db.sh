#!/bin/bash
set -e

PGDATA="/var/lib/postgresql/data"
DB_USER="postgres"
DB_PASS="KaiShieldDbPass123"  # 建議改為從環境變數讀取
DB_NAME="kaishield_db"

# 僅在首次啟動時初始化
if [ ! -f "$PGDATA/PG_VERSION" ]; then
    echo "===> 初始化 PostgreSQL 資料庫..."
    su postgres -c "initdb -D $PGDATA"

    # 允許本地連線
    echo "listen_addresses = '127.0.0.1'" >> $PGDATA/postgresql.conf
    echo "host all all 127.0.0.1/32 md5" >> $PGDATA/pg_hba.conf

    # 啟動臨時服務進行初始化
    su postgres -c "pg_ctl start -D $PGDATA"
    su postgres -c "psql -c \"CREATE USER $DB_USER WITH SUPERUSER PASSWORD '$DB_PASS';\""
    su postgres -c "createdb -O $DB_USER $DB_NAME"
    su postgres -c "pg_ctl stop -D $PGDATA"
fi

# 清理殘留 PID
rm -f $PGDATA/postmaster.pid
