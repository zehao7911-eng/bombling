from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json
import re

root = Path(__file__).resolve().parent

def module(name):
    source = (root / name).read_text("utf-8-sig")
    exports = re.findall(r"^export (?:function|class|const) (\w+)", source, re.M)
    source = re.sub(r"^import .*;\s*", "", source, flags=re.M)
    source = re.sub(r"^export ", "", source, flags=re.M)
    return source, exports

def bundle(name, binding, preamble=""):
    source, exports = module(name)
    return f"const {binding} = (() => {{\n{preamble}\n{source}\nreturn {{{','.join(exports)}}};\n}})();\n"

code = bundle("core.mjs","Core")
code += bundle("art.mjs","Art","const {world, rooms, tilesFor} = Core;")
code += bundle("sdk.mjs","SDK")
code += "const {View} = Art, {bridge} = SDK;\n"
code += module("app.mjs")[0]
markup = (root / "index-source.html").read_text("utf-8-sig")
markup = markup.replace('<link rel="stylesheet" href="style.css">', "<style>\n"+(root/"style.css").read_text("utf-8-sig")+"\n</style>")
markup = markup.replace('<script type="module" src="app.mjs"></script>', "<script>\n(()=>{\n"+code+"\n})();\n</script>")
for filename in ("index.html","standalone.html"):
    (root / filename).write_text(markup, "utf-8", newline="\n")
archive = root.parent / "BOMBLING.zip"
with ZipFile(archive,"w",ZIP_DEFLATED,compresslevel=9) as output:
    for file in sorted(root.iterdir()):
        if file.is_file():
            output.write(file, file.name)
with ZipFile(archive) as package:
    assert package.testzip() is None
    assert package.read("index.html") == package.read("standalone.html")
    assert all(package.read(file) == (root/file).read_bytes() for file in package.namelist())
    details = {"files":len(package.namelist()),"bytes":archive.stat().st_size,
               "sha256":hashlib.sha256(archive.read_bytes()).hexdigest()}
(root.parent/"bombling-package.json").write_text(json.dumps(details,indent=2),"utf-8")
print(json.dumps(details))

