import sys
from pathlib import Path
p = Path('almuheet-app.js')
s = p.read_text(encoding='utf-8')

counts = {'{':0,'}':0,'(':0,')':0,'[':0,']':0,'`':0}
for ch in counts.keys():
    counts[ch] = s.count(ch)
print('counts:', counts)

# scan for first imbalance of braces {}
balance = 0
for i,ch in enumerate(s):
    if ch == '{': balance += 1
    elif ch == '}': balance -= 1
    if balance < 0:
        print('Too many } at index', i)
        break
else:
    if balance != 0:
        print('Final brace balance:', balance)
    else:
        print('Braces balanced')

# scan for template literal backticks parity
print('backticks count:', counts['`'])

# find line number of last line
lines = s.splitlines()
print('Total lines:', len(lines))

# find line indices where lone backticks start/stop
open_bt = None
for lineno, line in enumerate(lines, start=1):
    if line.count('`') % 2 == 1:
        print('Odd backtick count at line', lineno, 'count', line.count('`'))

# show last 20 lines
print('\n--- LAST 20 LINES ---')
for L in lines[-20:]:
    print(L)
