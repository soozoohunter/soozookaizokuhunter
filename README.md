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
