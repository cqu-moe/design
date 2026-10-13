"""Extract Feed from its approved review sheet, preserving other family references."""
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image
ref = Path(__file__).resolve().parent / 'reference'
sheet = np.array(Image.open(ref / 'feed-approved-concept.png').convert('RGB'))
assert sheet.shape[:2] == (887, 1774)
x0,y0,x1,y1 = 630,45,1140,525
crop = sheet[y0:y1,x0:x1]
spread = crop.max(2).astype(int)-crop.min(2).astype(int)
mask = (spread>50).astype(np.uint8)*255
mask = (cv2.GaussianBlur(mask,(3,3),.7)>=128).astype(np.uint8)*255
count,labels,stats,_ = cv2.connectedComponentsWithStats(mask)
for i in range(1,count):
    if stats[i,cv2.CC_STAT_AREA]<20: mask[labels==i]=0
yy,xx=np.where(mask>0)
l,t,r,b=int(xx.min()),int(yy.min()),int(xx.max())+1,int(yy.max())+1
tight=np.pad(mask[t:b,l:r],4)
Image.fromarray(255-tight).save(ref/'feed-mask.png')
color=np.median(crop[cv2.erode(mask,np.ones((5,5),np.uint8))>0],axis=0).astype(int)
records=json.loads((ref/'extraction.json').read_text())
records['feed']={'crop':[x0+l-4,y0+t-4,r-l+8,b-t+8],'size':[int(tight.shape[1]),int(tight.shape[0])],'hex':'#'+''.join(f'{int(c):02x}' for c in color),'foregroundPixels':int((tight>0).sum())}
(ref/'extraction.json').write_text(json.dumps(records,indent=2)+'\n')
print(records['feed'])
