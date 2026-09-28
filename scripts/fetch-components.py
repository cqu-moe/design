import json, pathlib, urllib.request
root=pathlib.Path(__file__).resolve().parents[1]
names=['button','input','label','textarea','checkbox','switch','select','dialog','sheet','dropdown-menu','table','skeleton']
for name in names:
    url=f'https://ui.shadcn.com/r/styles/new-york-v4/{name}.json'
    obj=json.load(urllib.request.urlopen(url))
    for f in obj['files']:
        if not f['path'].endswith('.tsx'): continue
        content=f['content'].replace('from "cn"','from "../../lib/utils"')
        content=content.replace('@/lib/utils','../../lib/utils').replace('@/components/ui/','./').replace('@/registry/new-york-v4/ui/','./').replace('@ui/','./')
        target=root/'packages/ui/src/components/ui'/pathlib.Path(f['path']).name
        target.parent.mkdir(parents=True,exist_ok=True); target.write_text(content)
    print(name)
