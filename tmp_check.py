from html.parser import HTMLParser
from collections import Counter
import re
text=open('almuheet-enhanced.html', encoding='utf-8').read()
ids=[]
class MyParser(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for k,v in attrs:
            if k=='id': ids.append(v)
parser = MyParser()
parser.feed(text)
print('Duplicate IDs:')
for i,c in Counter(ids).items():
    if c>1:
        print(i, c)
print('pages with ids:', sorted(set(re.findall(r'id="page-([^"]+)"', text))))
print('existing showPage pages:', (sorted(set(re.findall(r"showPage\('([^']+)'", text)))) )[:50])
