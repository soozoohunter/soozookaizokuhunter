# Soozoo Kaizoku Hunter

Soozoo Kaizoku Hunter 是一個數位內容保護平台，整合了反向圖像搜尋、向量比對與區塊鏈存證，平台架構包含 React 前端、Express API、Python FastAPI，並使用 PostgreSQL、IPFS、Milvus 等服務，透過 Docker Compose 管理整體運行。

## 必要條件（Prerequisites）

* Docker 與 Docker Compose
* Node.js 18+
* Python 3.9+

請先複製專案並建立 `.env` 檔案（根據提供的範例），內含各服務所需的環境變數，無論 Docker 或本地端執行都需要。

以下為常用的 API 金鑰範例，可在 `.env` 中設定：

```bash
CLOUDINARY_API_KEY=your_cloudinary_key
RAPIDAPI_KEY=your_rapidapi_key
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key
GOOGLE_APPLICATION_CREDENTIALS=./credentials/gcp-vision.json
VISION_MAX_RESULTS=50
TINEYE_API_KEY=your_tineye_api_key
JWT_ACCESS_SECRET=your_super_secret_for_access_token
JWT_REFRESH_SECRET=your_super_secret_for_refresh_token
```

## 使用 Docker Compose 啟動整套系統

```bash
docker-compose up --build
```

## 設定 Google Cloud Vision API

1. 於 [Google Cloud Console](https://console.cloud.google.com/) 建立專案並啟用 **Vision API**。
2. 建立服務帳戶並產生 **JSON 金鑰**，將其複製為 `credentials/gcp-vision.json`（可先以 `credentials/gcp-vision.json.example` 為模板）。
3. 在 `.env` 或 `docker-compose.yml` 中加入下列設定：

   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/gcp-vision.json
   # 每次 Google Vision 搜尋回傳的網址數量上限 (預設 50)
   VISION_MAX_RESULTS=50
   ```

   `docker-compose.yml` 會自動將 `./credentials` 掛載到 `/app/credentials`（唯讀）。
4. 真實金鑰檔案已被 `.gitignore` 排除，請勿提交至版本庫。

若啟動時出現 `DECODER routines::unsupported` 等錯誤，通常表示金鑰內容無法解析。
請重新下載服務帳戶金鑰並確認 `private_key` 與 `client_email` 欄位完整。


## TinEye API

若要啟用 TinEye 反向圖搜尋，請在 `.env` 中設定：

```bash
TINEYE_API_KEY=your_tineye_api_key
````

## Protect API Endpoints

### POST `/api/protect/step1`

* 上傳圖片並生成保護證書
* 回傳資訊包含 `fileId`、`imageUrl`、`cid` 等

### POST `/api/protect/step2`

* 使用者完成 Step1 上傳後，可呼叫此端點進行後續伺服器處理

**參數**

* `fileId` (number, required)：Step1 回傳的檔案 ID

**回應範例**

```json
{
  "message": "Step2 處理完成",
  "fileId": 123
}
```

## Protect API Routes

Express 服務在 `/api/protect` 下提供上述端點，前端在完成上傳後即可依據 `fileId` 呼叫 Step2。

## Development

更新 Express API 程式碼（例如新增 `/api/protect/step2`）後，需要重新建置 Docker 容器才能套用變更，請執行：

```bash
docker compose build suzoo_express
docker compose up -d suzoo_express
```

## Monorepo Workflow

專案採用 pnpm 與 Turborepo 管理多個服務，開發前可執行：

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
```

常用指令：

```bash
pnpm dev    # 啟動所有服務
pnpm build  # 建構所有套件
pnpm lint   # 執行 ESLint
pnpm test   # 執行測試
```
