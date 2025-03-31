#!/usr/bin/env bash
#   Use this script to test if a given TCP host/port are available

# wait-for-it.sh by vishnubob (MIT License)
# Source: https://github.com/vishnubob/wait-for-it

set -u

HOST=""
PORT=""
WAITFORIT_timeout=15
WAITFORIT_strict=false
WAITFORIT_cmd=""
WAITFORIT_args=""

usage() {
  echo "
Usage: wait-for-it.sh [host:port] [options] -- [command args]
  host:port               Host and port to test.
Options:
  --timeout=SECONDS       Timeout in seconds, default: 15
  --strict                Only execute subcommand if the test succeeds
  --help                  This usage message
Example:
  ./wait-for-it.sh google.com:80 --timeout=30 --strict -- echo 'Google is up'
"
  exit 1
}

wait_for() {
  if [ "$HOST" = "" -o "$PORT" = "" ]; then
    echo "Error: you need to provide a host and port to test."
    usage
  fi

  echo "wait-for-it: waiting $WAITFORIT_timeout seconds for $HOST:$PORT to be available..."
  start_ts=$(date +%s)
  while :
  do
    if nc -z "$HOST" "$PORT" 2>/dev/null; then
      end_ts=$(date +%s)
      echo "wait-for-it: $HOST:$PORT is available after $(( end_ts - start_ts )) seconds"
      break
    fi
    sleep 1
    current_ts=$(date +%s)
    if [ $(( current_ts - start_ts )) -ge $WAITFORIT_timeout ]; then
      echo "wait-for-it: timeout after $WAITFORIT_timeout seconds waiting for $HOST:$PORT"
      if [ "$WAITFORIT_strict" = true ]; then
        echo "wait-for-it: strict mode, failing."
        exit 1
      fi
      break
    fi
  done
  return 0
}

parse_hostport() {
  IFS=':' read -r _HOST _PORT <<< "$1"
  HOST=${_HOST}
  PORT=${_PORT}
}

while [ $# -gt 0 ]
do
  case "$1" in
    *:* )
    parse_hostport "$1"
    shift
    ;;
    --timeout=*)
    WAITFORIT_timeout="${1#*=}"
    shift
    ;;
    --strict)
    WAITFORIT_strict=true
    shift
    ;;
    --help)
    usage
    ;;
    --)
    shift
    WAITFORIT_cmd="$1"
    if [ $# -gt 0 ]; then
      shift
      WAITFORIT_args=$@
    fi
    break
    ;;
    *)
    echo "Unknown argument: $1"
    usage
    ;;
  esac
done

if [ "$HOST" = "" -o "$PORT" = "" ]; then
  echo "Error: you must provide host:port as first argument."
  usage
fi

wait_for

# 如果有指定子命令，就執行
if [ "$WAITFORIT_cmd" != "" ]; then
  exec "$WAITFORIT_cmd" $WAITFORIT_args
else
  exit 0
fi
