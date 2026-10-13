"""Rebuild the content manifest and deterministic, portable brand ZIP (Python stdlib only)."""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
source = root / 'assets/brand/path-family'
files = sorted(p for p in source.rglob('*') if p.is_file()
               and p.name not in ('manifest.json', '.DS_Store')
               and '__pycache__' not in p.parts
               and not (p.parent.name == 'qa' and p.suffix == '.png'))
manifest = {}
for file in files:
    data = file.read_bytes()
    manifest[file.relative_to(source).as_posix()] = {
        'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()
    }
manifest_file = source / 'manifest.json'
manifest_file.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
archive = source.parent / 'cqu-moe-logo-kit-v1.zip'
with ZipFile(archive, 'w', compression=ZIP_DEFLATED) as bundle:
    for file in sorted([*files, manifest_file]):
        info = ZipInfo('cqu-moe-logo-kit-v1/' + file.relative_to(source).as_posix(), date_time=(2026, 10, 13, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        bundle.writestr(info, file.read_bytes())
with ZipFile(archive) as bundle:
    assert bundle.testzip() is None
print(f'{len(files) + 1} files: {archive.name}; SHA-256 {hashlib.sha256(archive.read_bytes()).hexdigest()}')
