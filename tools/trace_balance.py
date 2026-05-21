from pathlib import Path
p = Path('almuheet-app.js')
s = p.read_text(encoding='utf-8')
lines = s.splitlines()
balance = 0
first_positive_line = None
for lineno, line in enumerate(lines, start=1):
    for ch in line:
        if ch == '{': balance += 1
        elif ch == '}': balance -= 1
    if balance > 0 and first_positive_line is None:
        first_positive_line = lineno
    if lineno % 100 == 0:
        print('line', lineno, 'balance', balance)

print('FINAL BALANCE:', balance)
print('first line balance became >0:', first_positive_line)

# show context around first_positive_line
if first_positive_line:
    start = max(1, first_positive_line-5)
    end = min(len(lines), first_positive_line+5)
    print('\nContext around first_positive_line:')
    for L in range(start, end+1):
        print(f"{L:4}: {lines[L-1]}")
else:
    print('balance never > 0')
