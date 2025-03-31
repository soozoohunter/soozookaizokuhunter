#!/usr/bin/env sh
# wait-for-it.sh
# 針對 Alpine /bin/sh 改寫
# 來源: https://github.com/vishnubob/wait-for-it (MIT)
# 此版本移除所有 bash-only 語法，完全兼容 sh

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
    # 檢查 TCP
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

# 執行後續參數
exec "$@"
