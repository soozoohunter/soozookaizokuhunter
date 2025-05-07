# kaiShield/ai_service/aiPerturb.py
import os
import cv2
import numpy as np
import torch
from torchvision import models, transforms
import torchattacks

def apply_adversarial_perturbation(image_path: str) -> str:
    """
    對圖像進行對抗擾動，輸出 *perturbed.png
    """

    # 1) 讀取原圖 (BGR)
    orig_img = cv2.imread(image_path, cv2.IMREAD_COLOR)
    if orig_img is None:
        raise ValueError(f"Cannot read image: {image_path}")

    # 2) BGR -> RGB + to Tensor
    img_rgb = cv2.cvtColor(orig_img, cv2.COLOR_BGR2RGB)
    transform_ = transforms.Compose([transforms.ToTensor()])
    img_tensor = transform_(img_rgb).unsqueeze(0)  # [1,3,H,W]

    # 3) 載入預訓練 ResNet18
    model = models.resnet18(pretrained=True).eval()

    # 4) 設定對抗攻擊 (FGSM / PGD 皆可)
    attack = torchattacks.FGSM(model, eps=0.01)

    with torch.no_grad():
        pred = model(img_tensor)
        label = pred.argmax(dim=1)

    # 5) 生成對抗圖
    adv_tensor = attack(img_tensor, label).clamp(0,1)

    # 6) 轉回 numpy(BGR)
    adv_img = adv_tensor.squeeze(0).cpu().numpy()
    adv_img = (adv_img * 255).astype(np.uint8)
    adv_img = np.transpose(adv_img, (1,2,0))  # H,W,C
    adv_bgr = cv2.cvtColor(adv_img, cv2.COLOR_RGB2BGR)

    # 7) 輸出檔名
    dir_ = os.path.dirname(image_path)
    base_ = os.path.basename(image_path)
    name, ext = os.path.splitext(base_)
    out_name = f"{name}_perturbed.png"
    out_path = os.path.join(dir_, out_name)

    cv2.imwrite(out_path, adv_bgr)
    return out_name
