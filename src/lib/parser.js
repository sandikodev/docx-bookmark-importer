import JSZip from 'jszip'

export async function parseDocxBookmarks(file) {
  const zip = await JSZip.loadAsync(file)

  const relsXml = await zip.file('word/_rels/document.xml.rels').async('string')
  const docXml  = await zip.file('word/document.xml').async('string')

  // id -> url
  const relMap = {}
  for (const m of relsXml.matchAll(/Id="(rId\d+)"[^>]*Target="(https?:\/\/[^"]+)"/g)) {
    relMap[m[1]] = m[2]
  }

  // Parse paragraphs
  const paraRe = /<w:p[ >][\s\S]*?<\/w:p>/g
  const structure = [] // [{folder, items:[{title,url}]}]
  let currentFolder = null
  let currentItems  = []

  for (const para of docXml.matchAll(paraRe)) {
    const p = para[0]
    const styleM = p.match(/<w:pStyle w:val="([^"]+)"/)
    const style  = styleM ? styleM[1] : ''
    const texts  = [...p.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g)].map(m => m[1]).join('').trim()

    if (style === 'Heading3' && texts) {
      if (currentFolder !== null) structure.push({ folder: currentFolder, items: currentItems })
      currentFolder = texts.replace(/&amp;/g, '&')
      currentItems  = []
    } else if (p.includes('w:hyperlink')) {
      for (const hl of p.matchAll(/r:id="(rId\d+)">([\s\S]*?)<\/w:hyperlink>/g)) {
        const rid   = hl[1]
        const inner = hl[2]
        if (!relMap[rid]) continue
        const title = [...inner.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g)].map(m => m[1]).join('').trim().replace(/&amp;/g, '&')
        const url   = relMap[rid].replace(/&amp;/g, '&')
        if (title) currentItems.push({ title, url })
      }
    }
  }
  if (currentFolder !== null) structure.push({ folder: currentFolder, items: currentItems })

  // Deduplicate folder names
  const seen = {}
  for (const entry of structure) {
    const base = entry.folder
    seen[base] = (seen[base] || 0) + 1
    if (seen[base] > 1) entry.folder = `${base} (${seen[base]})`
  }

  return structure
}

export function generateBookmarkHtml(structure) {
  const ts = Math.floor(Date.now() / 1000)
  const lines = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '<DL><p>',
  ]
  for (const { folder, items } of structure) {
    lines.push(`    <DT><H3 ADD_DATE="${ts}">${folder}</H3>`)
    lines.push('    <DL><p>')
    for (const { title, url } of items) {
      lines.push(`        <DT><A HREF="${url}" ADD_DATE="${ts}">${title}</A>`)
    }
    lines.push('    </DL><p>')
  }
  lines.push('</DL><p>')
  return lines.join('\n')
}
