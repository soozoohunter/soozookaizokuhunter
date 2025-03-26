#!/bin/bash
set -e

# 定義路徑
PGDATA="/var/lib/postgresql/data"
INITDB_BIN="/usr/lib/postgresql/15/bin/initdb"

# 僅在首次啟動時初始化資料庫
if [ ! -f "$PGDATA/PG_VERSION" ]; then
    echo "===> 初始化 PostgreSQL 資料庫..."

    # 初始化資料目錄
    su postgres -c "$INITDB_BIN -D $PGDATA"

    # 修改配置以允許本地連接
    echo "listen_addresses='127.0.0.1'" >> $PGDATA/postgresql.conf
    echo "host all all 127.0.0.1/32 md5" >> $PGDATA/pg_hba.conf

    # 啟動 PostgreSQL 臨時服務進行初始化
    su postgres -c "pg_ctl start -D $PGDATA -o '-c listen_addresses=127.0.0.1'"

    # 建立資料庫與使用者（從環境變數讀取敏感資訊）
    DB_USER=${POSTGRES_USER:-postgres}
    DB_PASS=${POSTGRES_PASSWORD:-KaiShieldDbPass123}
    DB_NAME=${POSTGRES_DB:-kaishield_db}

    su postgres -c "psql -c \"CREATE USER $DB_USER WITH SUPERUSER PASSWORD '$DB_PASS';\""
    su postgres -c "createdb -O $DB_USER $DB_NAME"

    # 停止臨時服務
    su postgres -c "pg_ctl stop -D $PGDATA"
fi

# 移除可能殘留的 PID 檔案
rm -f $PGDATA/postmaster.pid
