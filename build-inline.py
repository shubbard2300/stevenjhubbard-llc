#!/usr/bin/env python3
"""Inline every local asset into a single self-contained HTML file."""
import base64, io, os, re, sys

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'index.html')
OUT = os.path.join(os.path.dirname(SRC), 'dist', 'index.html')

html = io.open(SRC, encoding='utf-8').read()
root = os.path.dirname(SRC)

def inline(m):
    path = m.group(1)
    if path.startswith(('http:', 'https:', 'data:', '//')):
        return m.group(0)
    full = os.path.join(root, path)
    if not os.path.isfile(full):
        sys.exit('missing asset: ' + path)
    ext = os.path.splitext(path)[1].lstrip('.').lower()
    mime = {'webp': 'image/webp', 'png': 'image/png', 'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg', 'svg': 'image/svg+xml'}[ext]
    b64 = base64.b64encode(io.open(full, 'rb').read()).decode('ascii')
    return 'src="data:%s;base64,%s"' % (mime, b64)

html = re.sub(r'src="([^"]+)"', inline, html)

# The artifact host wraps the file in its own <!doctype>/<html>/<head>/<body>,
# so strip ours. The deployed site keeps them — that is where lang= matters.
html = re.sub(r'^\s*<!doctype html>\s*\n', '', html, flags=re.I)
html = re.sub(r'^\s*<html[^>]*>\s*\n', '', html, flags=re.I)
html = re.sub(r'\n\s*</html>\s*$', '\n', html, flags=re.I)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
io.open(OUT, 'w', encoding='utf-8').write(html)
print('wrote %s  (%.2f MB)' % (OUT, os.path.getsize(OUT) / 1048576.0))
