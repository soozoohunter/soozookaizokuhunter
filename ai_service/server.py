# kaiShield/ai_service/server.py
import os
from flask import Flask, request, jsonify
from image_protector import apply_adversarial_perturbation

app = Flask(__name__)

# 與 Node.js 共用 uploads 資料夾 (Volume)
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'api_service', 'uploads')

@app.route('/perturb', methods=['POST'])
def perturb():
    try:
        data = request.get_json()
        filename = data.get('filename')
        if not filename:
            return jsonify({'status': 'error', 'message': 'No filename provided'}), 400

        input_path = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.isfile(input_path):
            return jsonify({'status': 'error', 'message': 'File not found'}), 404

        # 執行對抗擾動
        processed_filename = apply_adversarial_perturbation(input_path)

        return jsonify({
            'status': 'success',
            'processedFilename': processed_filename
        }), 200

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
