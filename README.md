# Soozoo Kaizoku Hunter

Soozoo Kaizoku Hunter 是一個數位內容保護平台，整合了反向圖像搜尋、向量比對與區塊鏈存證，平台架構包含 React 前端、Express API、Python FastAPI，並使用 PostgreSQL、IPFS、Milvus 等服務，透過 Docker Compose 管理整體運行。

## 必要條件（Prerequisites）

* Docker 與 Docker Compose
* Node.js 18+
* Python 3.9+

請先複製專案並建立 `.env` 檔案（根據提供的範例），內含各服務所需的環境變數，無論 Docker 或本地端執行都需要。

## 使用 Docker Compose 啟動整套系統

```bash
docker-compose up --build
```

## 設定 Google Cloud Vision API

1. 於 [Google Cloud Console](https://console.cloud.google.com/) 建立專案並啟用 **Vision API**。
2. 建立服務帳戶並產生 **JSON 金鑰**，下載後放入 `credentials/gcp-vision.json`。
3. 在 `.env` 或 Docker Compose 內設定環境變數：

   ```bash
   ```

GOOGLE\_APPLICATION\_CREDENTIALS=/app/credentials/gcp-vision.json

````

4. 為避免洩漏，`credentials/*.json` 已加入 `.gitignore`，可改以 `credentials/gcp-vision.json.example` 提供範例檔。

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
