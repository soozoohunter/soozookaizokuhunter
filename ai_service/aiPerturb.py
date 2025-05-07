# kaiShield/ai_service/aiPerturb.py

import sys
import os
import cv2

from image_protector import apply_adversarial_perturbation
from video_protector import apply_adversarial_to_video

def main(input_path, output_path):
    """
    AI擾動腳本:
      - 若檔案副檔名為 .png/.jpg/.jpeg => 使用 image_protector
      - 否則視為影片 => 使用 video_protector
    """
    _, ext = os.path.splitext(input_path)
    ext = ext.lower()

    if ext in ('.png','.jpg','.jpeg','.bmp'):
        # 處理單張圖片
        perturbed_name = apply_adversarial_perturbation(input_path)
        # e.g. input=  foo.jpg => perturbed_name= foo_perturbed.png
        # rename/move => output_path
        dir_ = os.path.dirname(input_path)
        perturbed_path = os.path.join(dir_, perturbed_name)

        if not os.path.isfile(perturbed_path):
            raise FileNotFoundError(f"[Error] expected perturbed file not found: {perturbed_path}")
        os.rename(perturbed_path, output_path)

    else:
        # 視為影片 => mp4, mov...
        apply_adversarial_to_video(input_path, output_path)


def usage():
    print("Usage: python aiPerturb.py <inputFile> <outputFile>")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        usage()
        sys.exit(1)

    inputFile = sys.argv[1]
    outputFile = sys.argv[2]

    if not os.path.isfile(inputFile):
        print(f"[Error] input file not found: {inputFile}")
        sys.exit(1)

    try:
        main(inputFile, outputFile)
        print(f"[Info] AI perturb done => {outputFile}")
    except Exception as e:
        print(f"[Error] {e}")
        sys.exit(1)
