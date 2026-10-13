"""Run with uv run --python 3.12 --with vtracer==0.6.15 python source/trace.py."""
from pathlib import Path
import json, importlib.metadata, sys
import vtracer

ref = Path(__file__).resolve().parent / 'reference'
names = sys.argv[1:] or [p['id'] for p in json.loads((ref.parent / 'marks.json').read_text())['products']]
for name in names:
    vtracer.convert_image_to_svg_py(
        str(ref / f'{name}-mask.png'), str(ref / f'{name}-trace.svg'),
        colormode='binary', mode='spline', filter_speckle=4,
        corner_threshold=75, length_threshold=3.0, max_iterations=10,
        splice_threshold=45, path_precision=3,
    )
(ref / 'tracer.json').write_text(json.dumps({'engine': 'vtracer', 'version': importlib.metadata.version('vtracer'), 'mode': 'binary spline'}, indent=2) + '\n')
print(f'Traced {len(names)} approved silhouettes')
