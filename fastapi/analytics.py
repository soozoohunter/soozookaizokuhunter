import random

def video_analysis(video_url):
    return {
        "video_url": video_url,
        "views": random.randint(100,99999),
        "likes": random.randint(1,5000),
        "score": round(random.uniform(0,10),2),
        "suggestion": "可透過廣告收益變現"
    }
