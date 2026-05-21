from pathlib import Path
s = Path('almuheet-app.js').read_text(encoding='utf-8')
lines = s.splitlines()
start = 1564-1
seg = '\n'.join(lines[start:])
print('segment lines', len(seg.splitlines()))
print('count {', seg.count('{'))
print('count }', seg.count('}'))
print('net', seg.count('{')-seg.count('}'))
