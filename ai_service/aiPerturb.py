# kaiShield/ai_service/aiPerturb.py

import sys
import os
import cv2

from image_protector import apply_adversarial_perturbation
from video_protector import apply_adversarial_to_video

def main(input_path, output_path):
    """
    AI擾動腳本:
      - 若檔案是圖片(.png/.jpg/.jpeg/.bmp 等)，則使用 image_protector.apply_adversarial_perturbation
        生成 *perturbed.png 後，再將該檔案移動/改名為 output_path
      - 若檔案副檔名屬於影片(如 mp4/mov 等)，則使用 video_protector.apply_adversarial_to_video
        直接輸出 output_path
    """
    # 依副檔名區分 圖片 / 影片
    _, ext = os.path.splitext(input_path)
    ext = ext.lower()

    if ext in ('.png', '.jpg', '.jpeg', '.bmp'):
        # === 圖片 ===
        perturbed_name = apply_adversarial_perturbation(input_path)
        # 舉例 input= foo.jpg => perturbed_name= foo_perturbed.png
        dir_ = os.path.dirname(input_path)
        perturbed_path = os.path.join(dir_, perturbed_name)

        if not os.path.isfile(perturbed_path):
            raise FileNotFoundError(f"[Error] Perturbed file not found: {perturbed_path}")

        # 直接 rename => output_path
        # 若 output_path 已存在也會被覆蓋
        os.rename(perturbed_path, output_path)

    else:
        # === 影片 === (如 mp4 / mov)
        apply_adversarial_to_video(input_path, output_path)


def usage():
    print("Usage: python aiPerturb.py <inputFile> <outputFile>")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        usage()
        sys.exit(1)

    inputFile = sys.argv[1]
    outputFile = sys.argv[2]

    # 檔案是否存在
    if not os.path.isfile(inputFile):
        print(f"[Error] input file not found: {inputFile}")
        sys.exit(1)

    try:
        main(inputFile, outputFile)
        print(f"[Info] AI perturb done => {outputFile}")
    except Exception as e:
        print(f"[Error] {e}")
        sys.exit(1)
