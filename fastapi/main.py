import uvicorn
from fastapi import FastAPI, UploadFile, File
from typing import Optional, List
from blockchain import upload_to_eth
from crawler import crawl_social, google_drive_operation, instagram_analysis, facebook_pages_analysis, tiktok_scraper
from analytics import calculate_cpi, suggest_cma
from dmca import bulk_infringement_check, initiate_lawsuit

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok", "service": "FastAPI"}

# 1) 區塊鏈 - 上傳
@app.post("/blockchain/upload")
async def blockchain_upload(file: UploadFile = File(...)):
    content = await file.read()
    tx_hash = upload_to_eth(content)
    return {"tx_hash": tx_hash}

# 2) 爬蟲
@app.get("/crawl/{platform}")
def crawl(platform: str, keyword: Optional[str] = None):
    if not keyword:
        return {"error": "keyword is required"}
    data = crawl_social(platform, keyword)
    return data

# 3) CPI 分析
@app.post("/analysis/cpi")
def analysis_cpi(video_url: str):
    cpi_value = calculate_cpi(video_url)
    return {"video_url": video_url, "CPI": cpi_value}

# 4) CMA 建議
@app.post("/analysis/cma")
def analysis_cma(video_url: str):
    suggestions = suggest_cma(video_url)
    return suggestions

# 5) 企業批量檢查
@app.post("/enterprise/bulkCheck")
def enterprise_bulk_check(urls: List[str]):
    return {"results": bulk_infringement_check(urls)}

# 6) 發起訴訟
@app.post("/lawsuit/initiate")
def lawsuit_init(work_id: int):
    return {"lawsuit_status": initiate_lawsuit(work_id)}

# 7) Google Drive
@app.get("/google/drive")
def google_drive_api():
    return google_drive_operation()

# 8) 其他爬蟲示例
@app.get("/ig/realtime")
def ig_realtime(keyword: str):
    return instagram_analysis(keyword)

@app.get("/fb/pages")
def fb_pages(keyword: str):
    return facebook_pages_analysis(keyword)

@app.get("/tiktok/scrape")
def tiktok_scrape_endpoint(keyword: str):
    return tiktok_scraper(keyword)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
