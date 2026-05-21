from pathlib import Path
p = Path('almuheet-app.js')
s = p.read_text(encoding='utf-8')
lines = s.splitlines()
stack = []
for lineno, line in enumerate(lines, start=1):
    for i,ch in enumerate(line):
        if ch == '{':
            stack.append((lineno, i, line[max(0,i-40):i+40]))
        elif ch == '}':
            if stack:
                stack.pop()
            else:
                print('Unmatched } at', lineno, 'char', i)
                raise SystemExit(0)

if stack:
    print('Unmatched { count:', len(stack))
    last = stack[-1]
    print('Last unmatched { at line', last[0], 'char', last[1])
    start = max(1, last[0]-5)
    end = min(len(lines), last[0]+5)
    print('\nContext lines around unmatched {:\n')
    for L in range(start, end+1):
        marker = '>>' if L==last[0] else '  '
        print(f"{marker} {L:4}: {lines[L-1]}")
else:
    print('All braces matched')
