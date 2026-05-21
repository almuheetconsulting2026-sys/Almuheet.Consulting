from pathlib import Path
p = Path('almuheet-app.js')
s = p.read_text(encoding='utf-8')
old = '\n\n// ═══════════════════════════════════════════════\n'
new = '\n  }\n\n// ═══════════════════════════════════════════════\n'
if old in s:
    s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')
    print('patched')
else:
    print('pattern not found')
