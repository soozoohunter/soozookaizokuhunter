import random

def video_analysis(video_url: str):
    # 模擬分析返回
    return {
        "video_url": video_url,
        "views": random.randint(100, 99999),
        "likes": random.randint(1, 5000),
        "CPI": round(random.uniform(0, 10), 2),
        "CMA": "廣告收益 / 聯盟行銷"
    }
