from pathlib import Path
import re

p = Path(r"C:\Users\almu9\Downloads\almuheet-enhanced.html")
t = p.read_text(encoding="utf-8")
sm = re.search(r"<style>\n([\s\S]*?)\n</style>", t)
jm = re.search(r"<script>\n([\s\S]*?)\n</script>", t)
assert sm and jm, "style/script not found"
css = sm.group(1)
js = jm.group(1)
Path(r"C:\Users\almu9\Downloads\almuheet-app.css").write_text(css + "\n", encoding="utf-8")
Path(r"C:\Users\almu9\Downloads\almuheet-app.js").write_text(js + "\n", encoding="utf-8")
t = t[:sm.start()] + '<link rel="stylesheet" href="./almuheet-app.css">' + t[sm.end():]
t = t[:jm.start()] + '<script src="./almuheet-app.js"></script>' + t[jm.end():]
p.write_text(t, encoding="utf-8")
