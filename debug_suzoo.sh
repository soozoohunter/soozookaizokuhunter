#!/usr/bin/env bash
set -euo pipefail

echo "1. ==== Express 实时日志中 RapidAPI 与 publicImages 相关行 ===="
docker compose logs suzoo_express | grep -E --line-buffered "RapidAPI|publicImages" || echo "(None)"

echo
echo "2. ==== origin/main 分支代码校验 ===-"
echo "- server.js 中 publicImages 路由："
git show origin/main:express/server.js | grep -n "publicImages" || echo "  ✗ 未找到"
echo "- visionService.js 中 RapidAPI 调用："
git show origin/main:express/services/visionService.js | grep -n "rapidApiService\|Calling RapidAPI" || echo "  ✗ 未找到"

echo
echo "3. ==== codex-fix 分支代码校验 ===-"
git fetch origin codex/修正靜態目錄與補充社交平台api調用:codex-fix
echo "- server.js 中 publicImages 路由："
git show codex-fix:express/server.js | grep -n "publicImages" || echo "  ✗ 未找到"
echo "- visionService.js 中 RapidAPI 调用："
git show codex-fix:express/services/visionService.js | grep -n "rapidApiService\|Calling RapidAPI" || echo "  ✗ 未找到"

echo
echo "4. ==== 容器内环境变量 RAPIDAPI_KEY ===-"
docker compose exec suzoo_express printenv RAPIDAPI_KEY || echo "  ✗ 未设置"

echo
echo "5. ==== 实际触发一次侵权扫描，查看返回的 rapid 字段 ===-"
# 这里假设你有一个本地测试图片 test.jpg
# 请确保 test.jpg 存在于当前目录，或者修改路径
if [ ! -f "test.jpg" ]; then
    echo "  ⚠ 警告：test.jpg 文件不存在，跳过第 5 步的实际扫描测试。"
    echo "  请创建一个名为 test.jpg 的图片文件在当前目录，或修改脚本中的路径。"
else
    echo "  正在使用 test.jpg 触发扫描..."
    curl -s \
      -F file=@test.jpg \
      http://localhost:3000/api/protect/scan \
      | jq '{tineye: .tineye, vision: .vision, rapid: .rapid}' || echo "  ✗ 扫描请求失败或 jq 未安装"
fi
