#!/usr/bin/env bash
set -euo pipefail

# ─── 1. 登录取得 JWT ─────────────────────────────────────
# 如果你改过 /auth/login 的账号/密码，请在这里替换
LOGIN_EMAIL="jeffqqm@gmail.com"
LOGIN_PASS="Zack967988"

LOGIN_RES=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"${LOGIN_EMAIL}"'",
    "password": "'"${LOGIN_PASS}"'"
  }')

TOKEN=$(echo "$LOGIN_RES" | grep -Po '"token"\s*:\s*"\K[^"]+')

if [[ -z "$TOKEN" ]]; then
  echo "❌ 無法取得 token，請確認 /auth/login 是否正確回傳"
  echo "回傳內容： $LOGIN_RES"
  exit 1
fi

echo "✅ 取得 JWT： $TOKEN"

# ─── 2. 呼叫侵權掃描 API ──────────────────────────────────
# 换成你自己刚刚放到 uploads/publicImages 里的测试图
IMAGE_URL="http://localhost:3000/uploads/publicImages/test.jpg"
echo "➡️  呼叫 /api/infringement/scan，請求圖片： $IMAGE_URL"

curl -s -w "\nHTTP_CODE:%{http_code}\n" -X POST http://localhost:3000/api/infringement/scan \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"'"${IMAGE_URL}"'"}' \
  | tee /tmp/scan_response.json

echo "💾 回傳結果已存為 /tmp/scan_response.json"

# ─── 3. 檢查後端日誌 ────────────────────────────────────
echo "📝 抓取最新 50 行 suzoo_express 日誌，過濾 Vision/TinEye 相關訊息"
docker compose logs suzoo_express --tail=50 \
  | grep -E "visionService|getVisionPageMatches|TinEye 搜索失败"

echo "🎉 檢查完畢！"
