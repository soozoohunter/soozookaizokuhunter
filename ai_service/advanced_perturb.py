# kaiShield/ai_service/advanced_perturb.py
import cv2
import numpy as np
import sys

def advanced_process_frame(frame, idx):
    h, w, c = frame.shape
    # (1) 亮度閃爍：依奇偶 idx (或可改成 mod(idx,3) if 3-cycle)
    alpha = 1.1 if (idx % 2 == 0) else 0.9
    flicker = cv2.convertScaleAbs(frame, alpha=alpha, beta=0)

    # (2) 子像素抖動(0.5px)：在偶數幀往右下0.5px，奇數幀往左上0.5px
    dx = 0.5 if (idx % 2 == 0) else -0.5
    M = np.float32([[1, 0, dx],[0, 1, dx]])
    jittered = cv2.warpAffine(flicker, M, (w, h), borderMode=cv2.BORDER_REPLICATE)

    # (後續可再加入彩度閃爍、局部遮罩等)
    return jittered

def main(inputPath, outputPath, targetFps=None):
    """
    :param inputPath:  原始影片路徑
    :param outputPath: 輸出影片路徑
    :param targetFps:  若要升幀(如120fps), 在此指定, 否則維持原 fps
    """
    cap = cv2.VideoCapture(inputPath)
    srcFps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    if targetFps is None or targetFps <= 0:
        # 預設不升幀, 就用原fps
        targetFps = srcFps

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(outputPath, fourcc, targetFps, (width, height))

    idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        processed = advanced_process_frame(frame, idx)
        # 若要插幀(如原本30fps -> 60fps), 也可在這裡重複寫兩次processed
        # 目前示範: 僅調整 output writer fps=targetFps, frames數不變(會加快播放速度)
        # 如果想保持播放速度不變但升幀, 必須在程式內做插幀(插重複幀或插補)
        out.write(processed)
        idx += 1
    cap.release()
    out.release()

if __name__=="__main__":
    """
    Usage: python advanced_perturb.py <input> <output> [targetFps]
    e.g. python advanced_perturb.py input.mp4 output.mp4 120
    """
    inPath = sys.argv[1]
    outPath = sys.argv[2]
    tgtFps = None
    if len(sys.argv) >= 4:
        tgtFps = float(sys.argv[3])
    main(inPath, outPath, tgtFps)
