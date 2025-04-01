#!/usr/bin/env bash
# -----------------------------------------------------------------------
# wait-for-it.sh
# 等待指定的 host:port 可連線後，再執行後續指令
# 支援參數：
#   -t, --timeout <seconds> : 最長等待秒數 (預設 15)
#   -s, --strict            : 逾時即 exit 1
#   -q, --quiet             : 靜默模式，不輸出多餘訊息
#   --                      : 後面接要執行的指令
# -----------------------------------------------------------------------
set -e

HOST="$1"
shift
PORT="$1"
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

while :  # 迴圈不斷嘗試
do
    nc -z "$HOST" "$PORT" >/dev/null 2>&1
    result=$?
    if [ $result -eq 0 ]; then
        end_ts=$(date +%s)
        if [ $quiet -eq 0 ]; then
            echo "$HOST:$PORT is available after $((end_ts - start_ts)) seconds"
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
