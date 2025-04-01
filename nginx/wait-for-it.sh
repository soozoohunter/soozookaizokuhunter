#!/usr/bin/env bash
# wait-for-it.sh
# -----------------------------------------------------------------------
# 依據指定的 host:port，等待服務可連線後才執行後續指令
# 支援參數：
#   -t, --timeout <seconds> : 最長等待秒數 (預設 15)
#   -s, --strict            : 嚴格模式，逾時即 exit 1
#   -q, --quiet             : 靜默模式，不顯示額外訊息
#   --                      : 後面接要執行的指令 (例如 nginx, node等)
# -----------------------------------------------------------------------
set -e

# 1) 取得第一個參數 -> HOST
HOST="$1"
shift
# 2) 取得第二個參數 -> PORT
PORT="$1"
shift

# 預設值
timeout=15
strict=0
quiet=0

# 解析其餘參數
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

# 不斷嘗試用 nc -z 檢查 HOST:PORT
while :
do
    # 檢查 TCP 連線是否可用
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

# 若已等到對方可用，或逾時但 strict=0，執行後續參數
exec "$@"
