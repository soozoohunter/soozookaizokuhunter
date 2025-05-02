cat > scripts/kwax_crawl.sh <<'EOF'
#!/usr/bin/env bash
set -e

BASE_URL="https://www.kwax.tw"
MIRROR_DIR="kwax_mirror"
VEC_API="http://localhost:8001/api/v1/image-insert"

# 1) 镜像整个站点（包含 HTML、CSS、图片、脚本）
wget --mirror \
     --no-clobber \
     --page-requisites \
     --adjust-extension \
     --span-hosts \
     --convert-links \
     --no-parent \
     -e robots=off \
     --directory-prefix=${MIRROR_DIR} \
     ${BASE_URL}

# 2) 从下载好的 HTML 中提取所有图片 URL
grep -RHoE '(src|href)="([^"]+\.(jpg|jpeg|png|gif))"' ${MIRROR_DIR}/${BASE_URL#https://}/ \
  | sed -E 's/.*="([^"]+)"/\1/' \
  | sort -u > image_urls.txt

# 3) 批量调用向量服务插入每张图片
while read img; do
  # 补全相对路径
  if [[ "${img}" =~ ^/ ]]; then
    url="${BASE_URL}${img}"
  else
    url="${img}"
  fi
  echo "[INSERT] $url"
  curl -s -X POST ${VEC_API} \
    -H "Content-Type: application/json" \
    -d "{\"image_url\":\"${url}\"}"
done < image_urls.txt

echo "✅ 全站图片已提交至向量服务。"
EOF
