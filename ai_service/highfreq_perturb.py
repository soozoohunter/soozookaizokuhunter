# kaiShield/ai_service/highfreq_perturb.py
import os
import sys
import cv2
import numpy as np
import random

def apply_highfreq_perturb(
    input_path: str,
    output_path: str,
    fps_factor: int = 2,
    do_mask: bool = False,
    mask_opacity: float = 0.15,
    mask_size_ratio: float = 0.2,
):
    """
    針對影片(或圖片)做高頻擾動:
      1) 亮度/對比 交替(奇偶幀)
      2) 子像素平移 (0.5px)
      3) (可選) 在畫面上隨機放置半透明遮罩(動態浮水印)
    參數:
      fps_factor: 輸出幀率相對於原影片 fps 的倍數 (預設2倍)
      do_mask:    是否啟用遮罩
      mask_opacity: 遮罩不透明度(0~1)
      mask_size_ratio: 遮罩寬高相對畫面大小(預設0.2= 20%)
    """

    cap = cv2.VideoCapture(input_path)
    orig_fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # 輸出fps = 原fps * fps_factor
    out_fps = orig_fps * fps_factor

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, out_fps, (width, height))

    frame_index = 0

    # 遮罩的寬高
    mask_w = int(width * mask_size_ratio)
    mask_h = int(height * mask_size_ratio)
    # 建立半透明黑色遮罩
    mask = np.zeros((mask_h, mask_w, 3), dtype=np.uint8)  # 全黑
    # BGR(0,0,0) + alpha
    # 這裡只示範用cv2.addWeighted, 不額外建立alpha channel

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # step1: 亮度交替(奇偶幀)
        # 例：偶數幀亮度+10%，奇數幀亮度-10%
        if frame_index % 2 == 0:
            # 增亮
            perturbed = cv2.convertScaleAbs(frame, alpha=1.1, beta=0)
        else:
            # 減亮
            perturbed = cv2.convertScaleAbs(frame, alpha=0.9, beta=0)

        # step2: 子像素平移 0.5px
        dx = 0.5 if frame_index % 2 == 0 else -0.5
        dy = 0.5 if frame_index % 2 == 0 else -0.5
        M = np.float32([[1,0,dx],[0,1,dy]])
        perturbed = cv2.warpAffine(perturbed, M, (width,height),
                                   borderMode=cv2.BORDER_REPLICATE)

        # step3: (可選) 遮罩隨機位置
        if do_mask and (frame_index % 5 == 0):
            # 每隔5幀移動一次遮罩位置 => 螢幕錄製會發現時時出現區塊
            # 人眼在高fps下不易察覺
            x0 = random.randint(0, max(0, width - mask_w))
            y0 = random.randint(0, max(0, height - mask_h))
            roi = perturbed[y0:y0+mask_h, x0:x0+mask_w]
            # 疊加
            #  alpha=1:perturbed + alpha=mask_opacity:mask => result
            perturbed[y0:y0+mask_h, x0:x0+mask_w] = cv2.addWeighted(
                roi, 1.0, mask, mask_opacity, 0
            )

        # 因為fps_factor=2 => 每一輸出幀都寫兩次(或可寫原幀 & perturbed幀交織)
        # 這裡簡化: 只寫"perturbed" 兩次, 讓輸出fps翻倍
        out.write(perturbed)
        out.write(perturbed)

        frame_index += 1

    cap.release()
    out.release()

def main():
    # 用法: python highfreq_perturb.py <input> <output> [--mask]
    # e.g. python highfreq_perturb.py input.mp4 output.mp4 --mask
    if len(sys.argv) < 3:
        print("Usage: python highfreq_perturb.py <input> <output> [--mask]")
        return
    in_path = sys.argv[1]
    out_path = sys.argv[2]
    do_mask = False
    if len(sys.argv) > 3 and sys.argv[3] == '--mask':
        do_mask = True
    apply_highfreq_perturb(in_path, out_path, fps_factor=2, do_mask=do_mask)

if __name__ == '__main__':
    main()
