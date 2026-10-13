"""Extract foreground silhouettes from the approved imagegen concept (Pillow, numpy, OpenCV)."""
from pathlib import Path
import json, shutil, sys
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
REF = ROOT / 'source' / 'reference'
REF.mkdir(exist_ok=True)
approved = Path(sys.argv[1]) if len(sys.argv) > 1 else REF / 'approved-concept.png'
if approved != REF / 'approved-concept.png':
    shutil.copyfile(approved, REF / 'approved-concept.png')
sheet = np.array(Image.open(approved).convert('RGB'))
assert sheet.shape[:2] == (887, 1774), 'Expected the approved 1774 x 887 sheet'
regions = {'schedule': (85, 105, 500, 500), 'auth': (710, 95, 1060, 485), 'quicklogin': (1280, 105, 1680, 495)}
records = {}
for name, (x0, y0, x1, y1) in regions.items():
    crop = sheet[y0:y1, x0:x1]
    spread = crop.max(2).astype(int) - crop.min(2).astype(int)
    mask = (spread > 50).astype(np.uint8) * 255
    mask = (cv2.GaussianBlur(mask, (3, 3), .7) >= 128).astype(np.uint8) * 255
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask)
    for i in range(1, count):
        if stats[i, cv2.CC_STAT_AREA] < 20:
            mask[labels == i] = 0
    yy, xx = np.where(mask > 0)
    left, top, right, bottom = int(xx.min()), int(yy.min()), int(xx.max()) + 1, int(yy.max()) + 1
    # The 4px white pad keeps every contour closed during tracing.
    tight = np.pad(mask[top:bottom, left:right], 4)
    Image.fromarray(255 - tight).save(REF / f'{name}-mask.png')
    inner = cv2.erode(mask, np.ones((5, 5), np.uint8)) > 0
    color = np.median(crop[inner], axis=0).astype(int)
    records[name] = {
        'crop': [x0 + left - 4, y0 + top - 4, right-left+8, bottom-top+8],
        'size': [int(tight.shape[1]), int(tight.shape[0])],
        'hex': '#' + ''.join(f'{int(c):02x}' for c in color),
        'foregroundPixels': int((tight > 0).sum()),
    }
    print(name, records[name])
(REF / 'extraction.json').write_text(json.dumps(records, indent=2) + '\n')
