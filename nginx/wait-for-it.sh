#!/usr/bin/env bash
# wait-for-it.sh: 依據指定 host:port，等待服務可用後再執行後續指令。
# ...
# (這是常見的 wait-for-it.sh 內容)

set -e

HOST="$1"
shift
PORT="$1"
shift

TIMEOUT=15
STRICT=false
WAITFORIT_CMD=""

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
