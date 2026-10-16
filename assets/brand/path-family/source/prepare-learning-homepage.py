"""Extract the approved Learning mark and option A of the homepage review sheet."""
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image

ref = Path(__file__).resolve().parent / 'reference'
records = json.loads((ref / 'extraction.json').read_text())
sources = {
    'learning': {'size': (1254, 1254), 'crop': (120, 240, 1110, 1010), 'hex': '#327354'},
    'cqu-moe': {'size': (1774, 887), 'crop': (140, 150, 560, 590), 'hex': '#6951A5'},
}
for name, spec in sources.items():
    image = Image.open(ref / f'{name}-approved-concept.png')
    assert image.size == spec['size'], (name, image.size)
    x0, y0, x1, y1 = spec['crop']
    crop = np.array(image.convert('RGBA'))[y0:y1, x0:x1]
    rgb = crop[:, :, :3].astype(int)
    # Color separation excludes the white board, labels and transparent background.
    mask = ((rgb.max(2) - rgb.min(2) > 40) & (crop[:, :, 3] >= 128)).astype(np.uint8) * 255
    mask = (cv2.GaussianBlur(mask, (3, 3), .7) >= 128).astype(np.uint8) * 255
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask)
    for i in range(1, count):
        if stats[i, cv2.CC_STAT_AREA] < 20:
            mask[labels == i] = 0
    yy, xx = np.where(mask > 0)
    l, t, r, b = int(xx.min()), int(yy.min()), int(xx.max()) + 1, int(yy.max()) + 1
    tight = np.pad(mask[t:b, l:r], 4)
    Image.fromarray(255 - tight).save(ref / f'{name}-mask.png')
    records[name] = {
        'reference': f'{name}-approved-concept.png',
        'crop': [x0+l-4, y0+t-4, r-l+8, b-t+8],
        'size': [int(tight.shape[1]), int(tight.shape[0])],
        'hex': spec['hex'],
        'foregroundPixels': int((tight > 0).sum()),
    }
    print(name, records[name])
(ref / 'extraction.json').write_text(json.dumps(records, indent=2) + '\n')
