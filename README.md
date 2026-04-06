# Docx Bookmark Importer

Convert Chrome bookmark export accidentally saved as `.docx` back to importable `.html` format.

## The Problem

Chrome's "Export bookmarks" feature saves a `.html` file. On some Windows 11 setups, the file dialog defaults to saving as `.docx` (Word Document) instead. Simply renaming the extension doesn't work — the file is a real `.docx` (ZIP-based XML), not HTML.

## How It Works

A `.docx` file is a ZIP archive containing XML files. The bookmark data is stored as:
- `word/_rels/document.xml.rels` — hyperlink ID → URL mapping
- `word/document.xml` — document structure with `Heading3` paragraphs as folder names and `<w:hyperlink>` elements as bookmark entries

## Origin: Python Prototype

This project started as a Python script to validate the approach:

```python
import zipfile, re, time, html as htmllib

with zipfile.ZipFile('bookmarks_4_6_26.docx') as z:
    rels_xml = z.read('word/_rels/document.xml.rels').decode()
    doc_xml  = z.read('word/document.xml').decode()

rel_map = {m.group(1): m.group(2)
           for m in re.finditer(r'Id="(rId\d+)"[^>]*Target="(https?://[^"]+)"', rels_xml)}

paras = re.findall(r'<w:p[ >].*?</w:p>', doc_xml, re.DOTALL)
ts = int(time.time())

structure = []
current_folder = None
current_items  = []

for p in paras:
    pstyle = re.search(r'<w:pStyle w:val="([^"]+)"', p)
    style  = pstyle.group(1) if pstyle else ''
    texts  = ''.join(re.findall(r'<w:t[^>]*>([^<]+)</w:t>', p)).strip()

    if style == 'Heading3' and texts:
        if current_folder is not None:
            structure.append((current_folder, current_items))
        current_folder = htmllib.unescape(texts)
        current_items  = []
    elif 'w:hyperlink' in p:
        for m in re.finditer(r'r:id="(rId\d+)">(.*?)</w:hyperlink>', p, re.DOTALL):
            rid, inner = m.group(1), m.group(2)
            if rid not in rel_map:
                continue
            title = htmllib.unescape(''.join(re.findall(r'<w:t[^>]*>([^<]+)</w:t>', inner)).strip())
            url   = htmllib.unescape(rel_map[rid])
            if title:
                current_items.append((title, url))

if current_folder is not None:
    structure.append((current_folder, current_items))

lines = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '<DL><p>',
    f'    <DT><H3 ADD_DATE="{ts}" PERSONAL_TOOLBAR_FOLDER="true">Bookmarks bar</H3>',
    '    <DL><p>',
    '    </DL><p>',
]
for folder, items in structure:
    lines.append(f'    <DT><H3 ADD_DATE="{ts}">{folder}</H3>')
    lines.append('    <DL><p>')
    for title, url in items:
        lines.append(f'        <DT><A HREF="{url}" ADD_DATE="{ts}">{title}</A>')
    lines.append('    </DL><p>')
lines.append('</DL><p>')

with open('bookmarks_recovered.html', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
```

The script successfully recovered **66 bookmarks across 5 folders** from the corrupted file, which confirmed the approach before porting to JavaScript.

## Web App (Svelte + Vite)

The logic was ported to a Svelte web app so anyone can use it without installing Python.

### Stack
- **Svelte** — minimal bundle, no runtime framework overhead
- **Vite** — fast build tooling
- **JSZip** — read `.docx` (ZIP) in the browser

### Usage

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, drag & drop your `.docx` file, preview the folder structure, then download `bookmarks.html`.

### Import to Chrome

1. Open `chrome://bookmarks/`
2. Click `⋮` → **Import bookmarks**
3. Select the downloaded `bookmarks.html`

## License

MIT
