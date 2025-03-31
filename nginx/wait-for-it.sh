#!/usr/bin/env bash
# wait-for-it.sh
# ...
# (省略具體內容)
# 原始腳本來自 https://github.com/vishnubob/wait-for-it
# 已移除所有 bash 依賴語法，完全兼容 Alpine sh

# 以下為修改後的完整腳本內容 (務必使用 LF 行尾符)
# ======================================================
set -e

host=$(echo "$1" | cut -d : -f 1)
port=$(echo "$1" | cut -d : -f 2)
shift
shift

timeout=15
strict=0
quiet=0

while [ $# -gt 0 ]; do
    case "$1" in
        -t|--timeout)
            timeout="$2"
            shift 2
            ;;
        -s|--strict)
            strict=1
            shift
            ;;
        -q|--quiet)
            quiet=1
            shift
            ;;
        --)
            shift
            break
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

start_ts=$(date +%s)
while :
do
    nc -z "$host" "$port" >/dev/null 2>&1
    result=$?
    if [ $result -eq 0 ]; then
        end_ts=$(date +%s)
        if [ $quiet -eq 0 ]; then
            echo "$host:$port is available after $((end_ts - start_ts)) seconds"
        fi
        break
    fi
    current_ts=$(date +%s)
    if [ $((current_ts - start_ts)) -ge "$timeout" ]; then
        if [ $quiet -eq 0 ]; then
            echo "Timeout ($timeout seconds) reached. Exiting."
        fi
        if [ $strict -eq 1 ]; then
            exit 1
        fi
        break
    fi
    sleep 1
done

exec "$@"
