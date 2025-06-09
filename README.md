# Soozoo Kaizoku Hunter

Soozoo Kaizoku Hunter 是一個數位內容保護平台，整合了反向圖像搜尋、向量比對與區塊鏈存證，平台架構包含 React 前端、Express API、Python FastAPI，並使用 PostgreSQL、IPFS、Milvus 等服務，透過 Docker Compose 管理整體運行。

## 必要條件（Prerequisites）

- Docker 與 Docker Compose
- Node.js 18+
- Python 3.9+

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
  GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/gcp-vision.json
  ```

4. 為避免洩漏，`credentials/*.json` 已加入 `.gitignore`，可改以 `credentials/gcp-vision.json.example` 提供範例檔。


## TinEye API

若要啟用 TinEye 反向圖搜尋，請在 `.env` 中設定：

```bash
TINEYE_API_KEY=your_tineye_api_key
```

## Protect API Routes

The Express service exposes endpoints under `/api/protect`.

### `POST /api/protect/step1`

- Upload a file and generate its protection certificate.
- Returns information such as `fileId`, `fingerprint`, `ipfsHash` and `txHash`.

### Step2 status

There is currently **no** `/api/protect/step2` endpoint. The Step2 page in the
UI simply reads the Step1 response from `localStorage` to display those
details.
