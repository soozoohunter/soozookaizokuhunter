import random

def calculate_cpi(video_url: str) -> float:
    """
    根據video_url(可能是YouTube/TikTok),
    從爬蟲抓到播放量、互動等資訊,再做簡易計算.
    這裡先示範回傳隨機值(200~800),模擬動態.
    """
    return round(random.uniform(200, 800), 2)

def suggest_cma(video_url: str) -> dict:
    """
    根據CPI & 互動率 給予變現建議
    """
    cpi_val = calculate_cpi(video_url)
    suggestions = []
    if cpi_val > 500:
        suggestions.append("廣告收益(AdSense)")
        suggestions.append("品牌合作(大型)")
    else:
        suggestions.append("聯盟行銷(小眾產品)")
        suggestions.append("付費訂閱(粉絲經營)")

    return {
        "CPI": cpi_val,
        "建議": suggestions
    }
