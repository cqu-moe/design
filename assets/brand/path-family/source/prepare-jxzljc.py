"""Extract the user-approved course-evaluation mark without the presentation text."""
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image

ref = Path(__file__).resolve().parent / 'reference'
image = Image.open(ref / 'jxzljc-approved-concept.png')
assert image.size == (1536, 1024), image.size
x0, y0, x1, y1 = (100, 90, 680, 600)
crop = np.array(image.convert('RGBA'))[y0:y1, x0:x1]
rgb = crop[:, :, :3].astype(int)
mask = ((rgb.max(2) - rgb.min(2) > 40) & (crop[:, :, 3] >= 128)).astype(np.uint8) * 255
mask = (cv2.GaussianBlur(mask, (3, 3), .7) >= 128).astype(np.uint8) * 255
count, labels, stats, _ = cv2.connectedComponentsWithStats(mask)
for i in range(1, count):
    if stats[i, cv2.CC_STAT_AREA] < 20:
        mask[labels == i] = 0
yy, xx = np.where(mask > 0)
l, t, r, b = int(xx.min()), int(yy.min()), int(xx.max()) + 1, int(yy.max()) + 1
assert l > 0 and t > 0 and r < x1-x0 and b < y1-y0, 'Crop clips the approved silhouette'
tight = np.pad(mask[t:b, l:r], 4)
Image.fromarray(255 - tight).save(ref / 'jxzljc-mask.png')
records = json.loads((ref / 'extraction.json').read_text())
records['jxzljc'] = {
    'reference': 'jxzljc-approved-concept.png',
    'crop': [x0+l-4, y0+t-4, r-l+8, b-t+8],
    'size': [int(tight.shape[1]), int(tight.shape[0])],
    'hex': '#A66B18',
    'foregroundPixels': int((tight > 0).sum()),
}
(ref / 'extraction.json').write_text(json.dumps(records, indent=2) + '\n')
print(records['jxzljc'])
