"""Normalize approved geometry without changing proportions; colors belong to the shared theme."""
from pathlib import Path
import json, sys
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parent
model = json.loads((root / 'marks.json').read_text())
extraction = json.loads((root / 'reference/extraction.json').read_text())
meanings = {
    'jxzljc': '评价气泡、勾选与环绕带，表达学生反馈、逐项核对与确认提交。',
    'learning': '展开的书页与命令提示符，贯穿的带状结构连接学习资源与命令行工具。',
    'cqu-moe': '折叠立方与开放的负空间，表达校园工具汇聚成统一入口。',
    'feed': '叠放的通知页与汇聚的信息流，表达多来源通知采集、统一阅读与存档。',
    'schedule': '叠放的日历页与贯穿其中的流动带，表达课表订阅及持续同步。',
    'auth': '清晰的锁形与交叠带状结构，表达身份认证及服务之间的可信连接。',
    'quicklogin': '环绕入口的连续带，表达浏览器登录状态的自动同步与顺畅通行。',
}
for p in model['products']:
    name = p['id']
    if sys.argv[1:] and name not in sys.argv[1:]:
        continue
    info = extraction[name]
    w,h = info['size']
    scale = 52 / (max(w,h)-8)
    p.pop('path',None);p.pop('tail',None)
    p['meaning'] = meanings[name]
    p['transform'] = f'translate({(64-w*scale)/2:.6f} {(64-h*scale)/2:.6f}) scale({scale:.8f})'
    p['paths'] = [dict(node.attrib) for node in ET.parse(root / f'reference/{name}-trace.svg').getroot() if node.tag.endswith('path')]
    for item in p['paths']:
        item.pop('fill',None)
    p['traceSize'] = [w,h]
# Keep the original family's approval record; later additions carry their own references.
model.setdefault('provenance', {'type': 'approved imagegen concept traced to editable Bezier paths', 'reference': 'reference/approved-concept.png', 'approvedDate': '2026-10-13'})
(root / 'marks.json').write_text(json.dumps(model,ensure_ascii=False,indent=2)+'\n')
print('Imported approved geometry; shared theme colors unchanged')
