# 檔案位置：python-vector-service/app.py
# 啟動方法： python app.py
# Docker Compose 則將此容器與 Milvus + Node 連結

from flask import Flask, request, jsonify
import os
import towhee
from towhee import pipeline
from pymilvus import Milvus, Collection, utility

app = Flask(__name__)

# 連線 Milvus
milvus_host = os.getenv('MILVUS_HOST', '127.0.0.1')
milvus_port = os.getenv('MILVUS_PORT', '19530')
milvus = Milvus(host=milvus_host, port=milvus_port)

# 建立/取得 Collection
collection_name = "my_video_col"
# ... 這裡您要先用 pymilvus 建立 schema

# 例：Towhee pipeline：自動讀取影片->抽幀->embedding
video_pipeline = pipeline("video-embedding")  # 請改成您實際需要的 pipeline

@app.route('/api/v1/indexVideo', methods=['POST'])
def index_video():
    file = request.files.get('video')
    file_id = request.form.get('id', 'unknown')
    if not file:
        return jsonify({'error': 'no video file'}), 400

    # 暫存影片
    local_path = f"/tmp/{file.filename}"
    file.save(local_path)
    print(f'[index_video] saved => {local_path}, id={file_id}')

    try:
        # 執行 Towhee pipeline => 例如會輸出一批embedding
        # (pseudo code) embeddings = video_pipeline(local_path)
        # embeddings: List[FloatVector], file_id: string => insert to Milvus
        # ...
        # 這裡省略 pipeline 細節
        return jsonify({'success': True, 'id': file_id}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(local_path):
            os.remove(local_path)

@app.route('/api/v1/index', methods=['POST'])
def index_image():
    """ 與您既有的 /api/v1/index (for 圖片) 同理 """
    pass

@app.route('/api/v1/search', methods=['POST'])
def search_image():
    """ 與您既有的 /api/v1/search (for 圖片檢索) """
    pass

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
