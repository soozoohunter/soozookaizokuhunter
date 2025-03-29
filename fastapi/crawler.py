import requests
from bs4 import BeautifulSoup

def crawl_social(platform, keyword):
    if platform == 'youtube':
        url = f"https://www.youtube.com/results?search_query={keyword}"
    elif platform == 'tiktok':
        url = f"https://www.tiktok.com/search?q={keyword}"
    else:
        return {"error": "unsupported platform"}
    resp = requests.get(url)
    soup = BeautifulSoup(resp.text, 'html.parser')
    return {"snippet": soup.get_text()[:300]}
