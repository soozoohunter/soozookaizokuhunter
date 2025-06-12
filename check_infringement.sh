#!/usr/bin/env bash
set -euo pipefail

# 1. 先登入取得 JWT（預設帳號請用你自己的，如果已改請自行替換）
LOGIN_EMAIL="jeffqqm@gmail.com"
LOGIN_PASS="Zack967988"
LOGIN_RES=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"${LOGIN_EMAIL}"'",
    "password": "'"${LOGIN_PASS}"'"
  }')

# 用 grep+sed 抽出 token
TOKEN=$(echo "$LOGIN_RES" | grep -Po '"token"\s*:\s*"\K[^"]+')

if [[ -z "$TOKEN" ]]; then
  echo "❌ 無法取得 token，請確認 /auth/login 是否正確回傳"
  echo "回傳內容： $LOGIN_RES"
  exit 1
fi

echo "✅ 取得 JWT： $TOKEN"

# 2. 呼叫侵權掃描 API
IMAGE_URL="https://suzookaizokuhunter.com/uploads/publicImages/public_45_1749636413526.png"
echo "➡️  呼叫 /api/infringement/scan，請求圖片： $IMAGE_URL"

curl -s -w "\nHTTP_CODE:%{http_code}\n" -X POST http://localhost:3000/api/infringement/scan \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"'"${IMAGE_URL}"'"}' \
  | tee /tmp/scan_response.json

echo "💾 回傳結果已存為 /tmp/scan_response.json"

# 3. 檢查後端日誌，確認是否有 Vision/TinEye 錯誤
echo "📝 抓取最新 50 行 suzoo_express 日誌，過濾 visionService 和 TinEye 相關錯誤"
docker compose logs suzoo_express --tail=50 \
  | grep -E "visionService|getVisionPageMatches|TinEye 搜索失败"

echo "🎉 檢查完畢！"
