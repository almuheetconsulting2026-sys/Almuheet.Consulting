from pathlib import Path
p = Path('almuheet-app.js')
s = p.read_text(encoding='utf-8')
lines = s.splitlines()
stack = []
for lineno, line in enumerate(lines, start=1):
    for i,ch in enumerate(line):
        if ch == '{': stack.append((lineno, i, line.strip()))
        elif ch == '}':
            if stack: stack.pop()
            else:
                print('Extra } at', lineno)

print('Unmatched { count:', len(stack))
for st in stack[-20:]:
    print('Unmatched { at line', st[0], 'snippet:', st[2])
