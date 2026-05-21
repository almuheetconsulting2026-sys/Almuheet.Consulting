from pathlib import Path
p = Path('almuheet-app.js')
s = p.read_text(encoding='utf-8')
lines = s.splitlines()
balance = 0
last_zero = 0
balances = []
for lineno, line in enumerate(lines, start=1):
    for ch in line:
        if ch == '{': balance += 1
        elif ch == '}': balance -= 1
    balances.append(balance)
    if balance == 0:
        last_zero = lineno

print('FINAL BALANCE:', balance)
print('last line where balance was 0:', last_zero)

# show context after last_zero
start = max(1, last_zero+1)
end = min(len(lines), start+50)
print(f'\nShowing lines {start}..{end} (context after last zero)')
for L in range(start, end+1):
    print(f"{L:4}: {lines[L-1]}")
