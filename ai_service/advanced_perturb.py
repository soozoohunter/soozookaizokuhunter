# ai_service/advanced_perturb.py
import cv2
import numpy as np
import sys

def advanced_process_frame(frame, idx):
    h, w, c = frame.shape
    # 1) 亮度閃爍(依奇偶idx)
    alpha = 1.1 if (idx % 2 == 0) else 0.9
    flicker = cv2.convertScaleAbs(frame, alpha=alpha, beta=0)
    # 2) 子像素抖動(0.5px)
    dx = 0.5 if (idx % 2 == 0) else -0.5
    M = np.float32([[1,0,dx],[0,1,dx]])
    jittered = cv2.warpAffine(flicker, M, (w,h), borderMode=cv2.BORDER_REPLICATE)
    return jittered

def main(inputPath, outputPath):
    cap = cv2.VideoCapture(inputPath)
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(outputPath, fourcc, fps, (width, height))

    idx = 0
    while True:
        ret, frame = cap.read()
        if not ret: break
        # BGR frame
        processed = advanced_process_frame(frame, idx)
        out.write(processed)
        idx += 1
    cap.release()
    out.release()

if __name__=="__main__":
    # python advanced_perturb.py input.mp4 output.mp4
    inPath = sys.argv[1]
    outPath = sys.argv[2]
    main(inPath, outPath)
