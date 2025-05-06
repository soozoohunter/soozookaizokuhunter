# ai_service/video_protector.py
import cv2
import torch
import numpy as np
from torchvision import models, transforms
import torchattacks

def apply_adversarial_to_video(input_path, output_path, eps=0.01):
    cap = cv2.VideoCapture(input_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    model = models.resnet18(pretrained=True).eval()
    attack = torchattacks.FGSM(model, eps=eps)

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        # BGR -> RGB
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        # to tensor
        x = transforms.ToTensor()(rgb).unsqueeze(0)
        with torch.no_grad():
            pred = model(x)
            label = pred.argmax(dim=1)
        adv_x = attack(x, label)
        adv_np = adv_x.squeeze(0).detach().cpu().numpy()
        adv_np = np.clip(adv_np, 0, 1)*255
        adv_np = adv_np.transpose(1,2,0).astype(np.uint8)
        adv_bgr = cv2.cvtColor(adv_np, cv2.COLOR_RGB2BGR)
        out.write(adv_bgr)

    cap.release()
    out.release()
    return output_path
