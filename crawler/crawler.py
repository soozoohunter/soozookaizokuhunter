import os
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")
EXPRESS_API = "http://suzoo_express:3000/api/infr/foundInfringement"

@app.route('/scan', methods=['POST'])
def scan():
    data = request.get_json()
    fingerprint = data.get('fingerprint')
    userId = data.get('userId')
    fileType = data.get('fileType')
    if not fingerprint or not userId:
        return jsonify({"error":"Missing fingerprint/userId"}), 400

    # 在這裡可利用 RAPIDAPI_KEY 進行多平台搜尋
    # (省略實際爬蟲邏輯，示範一個假設 "發現侵權URL=xxx")
    found_infringing_url = None

    # 例如：若 fake => 當 fingerprint 的前 8 碼 == "abcdef12" 就當作找到
    if fingerprint.startswith("abcdef12"):
        found_infringing_url = "https://someplatform.com/fake-infringing"

    # 如真的找到可疑 URL，就呼叫 Express /api/infr/foundInfringement
    if found_infringing_url:
        try:
            resp = requests.post(EXPRESS_API, json={
                "workId": 1,    # 您需要在 /api/upload 時將workId帶給爬蟲
                "infringingUrl": found_infringing_url,
                "status": "detected"
            })
            print("foundInfringement response:", resp.text)
        except Exception as e:
            print("Error calling foundInfringement:", e)

    return jsonify({"message":"scan done", "foundUrl": found_infringing_url})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9090)
