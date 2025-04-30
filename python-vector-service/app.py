# python-vector-service/app.py
from flask import Flask, request
import os

import towhee
from towhee import pipeline
from pymilvus import connections, Collection

app = Flask(__name__)

# 1) 連線 Milvus
# 假設您在 docker-compose 裡面服務名稱叫 "milvus"、port=19530
connections.connect("default", host="milvus", port="19530")

# 2) 定義一個示範 Pipeline (假設是用 "video-embedding")
video_pipeline = pipeline("video-embedding")

@app.route('/api/v1/indexVideo', methods=['POST'])
def index_video():
    """
    接收整支影片，存在 /tmp，再交給 Towhee pipeline 做抽幀+embedding
    之後插入 Milvus
    """
    file = request.files.get('video')
    file_id = request.form.get('id', 'unknown')

    if not file:
        return {'error': 'no video file'}, 400

    # 保存臨時檔
    local_path = f"/tmp/{file.filename}"
    file.save(local_path)

    try:
        # 執行 Towhee pipeline
        # pipeline 會做抽幀 => embedding => insert to "my_video_collection"
        video_pipeline(local_path, milvus_collection="my_video_collection")
        # (這裡只是示意，實際 pipeline 參數視 towhee 版本與 workflows 而定)
    except Exception as e:
        return {'error': str(e)}, 500
    finally:
        if os.path.exists(local_path):
            os.remove(local_path)

    return {'success': True, 'id': file_id}, 200


@app.route('/api/v1/index', methods=['POST'])
def index_image():
    """
    與您先前的 indexImageVector 類似：接收單張圖片 => insert into Milvus
    """
    file = request.files.get('image')
    file_id = request.form.get('id', 'unknown')

    if not file:
        return {'error': 'no image file'}, 400

    local_path = f"/tmp/{file.filename}"
    file.save(local_path)

    try:
        # (示範) 使用 towhee image-embedding pipeline
        # e.g. pipeline("image-embedding") -> insert to "my_image_collection"
        pass
    except Exception as e:
        return {'error': str(e)}, 500
    finally:
        if os.path.exists(local_path):
            os.remove(local_path)

    return {'success': True, 'id': file_id}, 200


@app.route('/api/v1/search', methods=['POST'])
def search_image():
    """
    與您先前 searchImageByVector 類似：接收圖片 => embedding => Milvus search
    回傳 topK 相似結果
    """
    file = request.files.get('image')
    topK_str = request.form.get('topK', '5')

    if not file:
        return {'error': 'no image file'}, 400

    local_path = f"/tmp/{file.filename}"
    file.save(local_path)

    try:
        # (示意) embedding = pipeline(...)  => milvus.search(embedding, ...)
        topK = int(topK_str)
        # ...
        # e.g. results = [ { 'id':'xxx', 'score':0.88 }, ...]
        results = []
        return {'query_id':'abc123', 'results': results}, 200
    except Exception as e:
        return {'error': str(e)}, 500
    finally:
        if os.path.exists(local_path):
            os.remove(local_path)


if __name__=='__main__':
    # Flask 預設 port=5000，可自行改 8000
    app.run(host='0.0.0.0', port=8000)
