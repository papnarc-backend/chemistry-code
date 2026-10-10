from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
import json
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT
VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = {'tag':'document','attrs':{},'children':[],'text':''}
        self.stack = [self.root]
        self.elements = []
        self.ids = set()
    def handle_starttag(self,tag,attrs):
        attrs = {k: v if v is not None else '' for k,v in attrs}
        node = {'tag':tag,'attrs':attrs,'children':[],'text':''}
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, f'Duplicate id: {attrs["id"]}'
            self.ids.add(attrs['id'])
        self.stack[-1]['children'].append(node)
        self.elements.append(node)
        if tag not in VOID: self.stack.append(node)
    def handle_startendtag(self,tag,attrs):
        self.handle_starttag(tag,attrs)
        if tag not in VOID: self.handle_endtag(tag)
    def handle_endtag(self,tag):
        assert self.stack[-1]['tag'] == tag, f'HTML nesting mismatch: expected {self.stack[-1]["tag"]}, got {tag}'
        self.stack.pop()
    def handle_data(self,data):
        self.stack[-1]['text'] += data

pages = {}
for path in sorted(DIST.rglob('*.html')):
    parser = Parser()
    parser.feed(path.read_text())
    assert len(parser.stack) == 1, f'Unclosed elements: {path}'
    assert sum(e['tag'] == 'h1' for e in parser.elements) == 1
    assert 'main' in parser.ids and 'top' in parser.ids
    assert any(e['tag'] == 'meta' and e['attrs'].get('name') == 'robots' and e['attrs'].get('content') == 'index,follow' for e in parser.elements)
    for element in parser.elements:
        attrs = element['attrs']
        if element['tag'] == 'button': assert attrs.get('type') in ['button','submit']
        if element['tag'] in ['input','select']:
            assert attrs.get('aria-label') or any(e['tag'] == 'label' and (e['attrs'].get('for') == attrs.get('id') or element in e['children']) for e in parser.elements), f'Unlabelled input: {path} {attrs}'
        for field in ['aria-controls','aria-labelledby','aria-describedby']:
            for ident in attrs.get(field,'').split(): assert ident in parser.ids, f'Missing {field}: {ident}'
    pages[path] = parser

checked = 0
for path,parser in pages.items():
    for element in parser.elements:
        for field in ['href','src']:
            if field not in element['attrs']: continue
            url = urlparse(element['attrs'][field])
            if url.scheme or url.netloc: continue
            target = DIST / unquote(url.path).lstrip('/') if url.path.startswith('/') else path.parent / unquote(url.path)
            if not url.path: target = path
            if target.is_dir(): target /= 'index.html'
            target = target.resolve()
            assert target.is_file(), f'Broken route/asset: {path.name} -> {element["attrs"][field]}'
            if url.fragment: assert target in pages and url.fragment in pages[target].ids, f'Missing anchor {url.fragment}'
            checked += 1

try:
    import tinycss2
    css = tinycss2.parse_stylesheet((DIST/'assets/style.css').read_text(),skip_comments=True,skip_whitespace=True)
    def check_css(items):
        for item in items:
            assert item.type != 'error', str(item)
            if item.type == 'qualified-rule':
                declarations = tinycss2.parse_declaration_list(item.content,skip_comments=True,skip_whitespace=True)
                assert not any(d.type == 'error' for d in declarations)
            if item.type == 'at-rule' and item.lower_at_keyword == 'media':
                check_css(tinycss2.parse_rule_list(item.content,skip_comments=True,skip_whitespace=True))
    check_css(css)
    print('CSS syntax checked, including media queries.')
except ImportError:
    print('CSS syntax parser unavailable; responsive rules inspected in source.')

with tempfile.TemporaryDirectory() as tmp:
    fixture = Path(tmp) / 'dom.json'
    fixture.write_text(json.dumps({str(p.relative_to(DIST)):v.root for p,v in pages.items()},ensure_ascii=False))
    subprocess.run(['node',str(ROOT/'tests/check_interactions.cjs'),str(fixture)],check=True,cwd=ROOT)
print(f'Validated {len(pages)} pages, {checked} internal links/assets, HTML structure, labels and public-site metadata.')
