"""Normalize traced geometry without changing its proportions; sample colors in OKLCH."""
from pathlib import Path
import json, math
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parent
model = json.loads((root / 'marks.json').read_text())
extraction = json.loads((root / 'reference/extraction.json').read_text())
def oklch(hexcolor):
    rgb = [int(hexcolor[i:i+2], 16)/255 for i in (1,3,5)]
    r,g,b = [v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb]
    l = (.4122214708*r+.5363325363*g+.0514459929*b)**(1/3)
    m = (.2119034982*r+.6806995451*g+.1073969566*b)**(1/3)
    s = (.0883024619*r+.2817188376*g+.6299787005*b)**(1/3)
    L = .2104542553*l+.793617785*m-.0040720468*s
    a = 1.9779984951*l-2.428592205*m+.4505937099*s
    b = .0259040371*l+.7827717662*m-.808675766*s
    return [round(L,6),round(math.hypot(a,b),6),round(math.degrees(math.atan2(b,a))%360,6)]
meanings = {
    'schedule': '叠放的日历页与贯穿其中的流动带，表达课表订阅及持续同步。',
    'auth': '清晰的锁形与交叠带状结构，表达身份认证及服务之间的可信连接。',
    'quicklogin': '环绕入口的连续带，表达浏览器登录状态的自动同步与顺畅通行。',
}
for p in model['products']:
    name = p['id']
    info = extraction[name]
    w,h = info['size']
    scale = 52 / (max(w,h)-8)
    p.pop('path',None);p.pop('tail',None)
    p['meaning'] = meanings[name]
    p['color'] = oklch(info['hex'])
    p['darkColor'] = [.8,min(.10,p['color'][1]*.65),p['color'][2]]
    p['transform'] = f'translate({(64-w*scale)/2:.6f} {(64-h*scale)/2:.6f}) scale({scale:.8f})'
    p['paths'] = [dict(node.attrib) for node in ET.parse(root / f'reference/{name}-trace.svg').getroot() if node.tag.endswith('path')]
    for item in p['paths']:
        item.pop('fill',None)
    p['traceSize'] = [w,h]
model['provenance'] = {'type': 'approved imagegen concept traced to editable Bezier paths', 'reference': 'reference/approved-concept.png', 'approvedDate': '2026-10-13'}
(root / 'marks.json').write_text(json.dumps(model,ensure_ascii=False,indent=2)+'\n')
print('Imported approved geometry and sampled colors')
