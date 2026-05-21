from pathlib import Path
p = Path('almuheet-app.js')
s = p.read_text(encoding='utf-8')
lines = s.splitlines()
balance = 0
max_balance = 0
peaks = []
for lineno, line in enumerate(lines, start=1):
    for ch in line:
        if ch == '{': balance += 1
        elif ch == '}': balance -= 1
    if balance > max_balance:
        max_balance = balance
        peaks.append((lineno, max_balance, line.strip()))

print('FINAL BALANCE:', balance)
print('Peaks (lineno, balance):')
for p in peaks[-10:]:
    print(p)

# show surrounding context of last peak
if peaks:
    lineno = peaks[-1][0]
    start = max(1, lineno-10)
    end = min(len(lines), lineno+10)
    print(f'\nContext around last peak at line {lineno}:')
    for L in range(start, end+1):
        print(f"{L:4}: {lines[L-1]}")
