<script>
  import { fade, slide } from 'svelte/transition'
  import { parseDocxBookmarks, generateBookmarkHtml } from './lib/parser.js'

  let status = $state(null)   // { type: 'loading'|'success'|'error', text: string }
  let structure = $state([])
  let dragging = $state(false)

  let isExtension = $state(typeof chrome !== 'undefined' && chrome.bookmarks)
  let skipDuplicates = $state(true)
  let chromeFolders = $state([])
  let targetFolderId = $state('1') // Default ke '1' (Bookmarks Bar)
  let history = $state([])
  let currentFileName = ''

  // i18n helper
  const t = (key) => isExtension ? chrome.i18n.getMessage(key) : {
    dropLabel: 'Drag & drop your .docx file here',
    browseFile: 'Browse file',
    importToChrome: 'Import to Chrome',
    downloadHtml: 'Download bookmarks.html',
    skipDuplicates: 'Skip duplicate URLs',
    importInto: 'Import into:',
    recentImports: 'Recent Imports',
    clear: 'Clear'
  }[key] || key

  async function loadHistory() {
    if (!isExtension) return
    const data = await chrome.storage.local.get('importHistory')
    history = data.importHistory || []
  }

  async function saveToHistory(fileName, count) {
    if (!isExtension) return
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      fileName,
      count
    }
    const updatedHistory = [newEntry, ...history].slice(0, 10)
    await chrome.storage.local.set({ importHistory: updatedHistory })
    history = updatedHistory
  }

  async function clearHistory() {
    if (!isExtension) return
    await chrome.storage.local.remove('importHistory')
    history = []
  }

  async function loadChromeFolders() {
    if (!isExtension) return
    const tree = await chrome.bookmarks.getTree()
    const folders = []
    
    function walk(nodes) {
      for (const node of nodes) {
        if (node.children) {
          folders.push({ id: node.id, title: node.title || 'Root' })
          walk(node.children)
        }
      }
    }
    walk(tree)
    chromeFolders = folders
  }

  async function loadPreferences() {
    if (!isExtension) return
    const prefs = await chrome.storage.local.get({
      preferredFolderId: '1',
      autoSkipDuplicates: true
    })
    targetFolderId = prefs.preferredFolderId
    skipDuplicates = prefs.autoSkipDuplicates
  }

  $effect(() => {
    if (isExtension) {
      loadChromeFolders()
      loadHistory()
      loadPreferences()
    }
  })

  async function handleFile(file) {
    if (!file) return
    if (!file.name.endsWith('.docx')) {
      status = { type: 'error', text: 'Please select a .docx file.' }
      return
    }
    currentFileName = file.name
    status = { type: 'loading', text: 'Parsing…' }
    structure = []
    try {
      structure = await parseDocxBookmarks(file)
      const total = structure.reduce((n, f) => n + f.items.length, 0)
      status = { type: 'success', text: `Found ${total} bookmarks across ${structure.length} folders` }
    } catch (e) {
      status = { type: 'error', text: e.message }
    }
  }

  async function importToChrome() {
    if (!isExtension) return
    status = { type: 'loading', text: 'Checking for duplicates & importing…' }
    try {
      // 1. Create a root folder for this import session within the target folder
      const rootFolder = await chrome.bookmarks.create({
        parentId: targetFolderId,
        title: `Imported from Docx (${new Date().toLocaleDateString()})`
      })

      let totalAdded = 0
      let totalSkipped = 0

      for (const folder of structure) {
        // Create the subfolder
        const chromeFolder = await chrome.bookmarks.create({
          parentId: rootFolder.id,
          title: folder.folder
        })

        for (const item of folder.items) {
          // Check for duplicate URLs if skipDuplicates is true
          if (skipDuplicates) {
            const results = await chrome.bookmarks.search({ url: item.url })
            if (results.length > 0) {
              totalSkipped++
              continue
            }
          }

          await chrome.bookmarks.create({
            parentId: chromeFolder.id,
            title: item.title,
            url: item.url
          })
          totalAdded++
        }
      }

      if (totalAdded > 0) {
        await saveToHistory(currentFileName, totalAdded)
      }

      status = { type: 'success', text: `Imported ${totalAdded} bookmarks. Skipped ${totalSkipped} duplicates.` }
    } catch (e) {
      status = { type: 'error', text: `Import failed: ${e.message}` }
    }
  }

  function download() {
    const html = generateBookmarkHtml(structure)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    a.download = 'bookmarks.html'
    a.click()
  }

  function reset() {
    status = null
    structure = []
  }

  function onDrop(e) {
    e.preventDefault()
    dragging = false
    handleFile(e.dataTransfer.files[0])
  }

  function onInputChange(e) {
    handleFile(e.target.files[0])
    e.target.value = ''
  }
</script>

<svelte:window
  ondragover={(e) => { e.preventDefault(); dragging = true }}
  ondragleave={() => dragging = false}
  ondrop={onDrop}
/>

<div class="card" transition:fade>
  <header>
    <div class="icon-wrap">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    </div>
    <div class="header-text">
      <h1>Docx Bookmark Importer</h1>
      <p class="subtitle">Convert Chrome bookmarks accidentally saved as <code>.docx</code> back to importable <code>.html</code></p>
    </div>
    {#if structure.length > 0 || (status && status.type === 'error')}
      <button class="reset-btn" onclick={reset} aria-label="Reset" title="Reset">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
      </button>
    {/if}
  </header>

  {#if structure.length === 0}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <label
      class="dropzone"
      class:active={dragging}
      ondragover={(e) => { e.preventDefault(); dragging = true }}
      ondragleave={() => dragging = false}
      ondrop={onDrop}
      transition:slide
    >
      <div class="drop-circle">
        <svg class="drop-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 16 12 12 8 16"/>
          <line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
        </svg>
      </div>
      <p class="drop-label">{@html t('dropLabel').replace('.docx', '<strong>.docx</strong>')}</p>
      <span class="or">or</span>
      <span class="browse-btn">{t('browseFile')}</span>
      <input type="file" accept=".docx" onchange={onInputChange} />
    </label>
  {/if}

  {#if status}
    <div class="status {status.type}" transition:slide>
      {#if status.type === 'loading'}
        <span class="spinner"></span>
      {:else if status.type === 'success'}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      {:else}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {/if}
      {status.text}
    </div>
  {/if}

  {#if structure.length > 0}
    <div class="preview" transition:slide>
      {#each structure as { folder, items }}
        <details open={structure.length < 3}>
          <summary>
            <svg class="folder-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z"/></svg>
            <span>{folder}</span>
            <span class="badge">{items.length}</span>
            <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </summary>
          <ul>
            {#each items as { title, url }}
              <li>
                <img class="favicon" src="https://www.google.com/s2/favicons?sz=16&domain={new URL(url).hostname}" alt="" width="14" height="14" />
                <a href={url} target="_blank" rel="noopener noreferrer">{title}</a>
              </li>
            {/each}
          </ul>
        </details>
      {/each}
    </div>

    {#if isExtension}
      <div class="options-bar" transition:fade>
        <div class="option-row">
          <label for="targetFolder">{t('importInto')}</label>
          <select id="targetFolder" bind:value={targetFolderId}>
            {#each chromeFolders as folder}
              <option value={folder.id}>{folder.title || 'Root'}</option>
            {/each}
          </select>
        </div>
        
        <label class="toggle">
          <input type="checkbox" bind:checked={skipDuplicates} />
          <span class="slider"></span>
          <span class="label-text">{t('skipDuplicates')}</span>
        </label>
      </div>

      <button class="import-btn" onclick={importToChrome} transition:fade>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="8" x2="12" y2="8.01"/><line x1="12" y1="16" x2="12" y2="16.01"/><line x1="8" y1="12" x2="8.01" y2="12"/><line x1="16" y1="12" x2="16.01" y2="12"/>
        </svg>
        {t('importToChrome')}
      </button>
    {/if}

    <button class="download-btn" onclick={download} transition:fade>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      {t('downloadHtml')}
    </button>

    <p class="hint" transition:fade>
      Import: open <code>chrome://bookmarks/</code> → <code>⋮</code> → <strong>Import bookmarks</strong>
    </p>
  {/if}

  {#if isExtension && history.length > 0}
    <div class="history-section" transition:slide>
      <div class="history-header">
        <h2>{t('recentImports')}</h2>
        <button class="clear-btn" onclick={clearHistory}>{t('clear')}</button>
      </div>
      <div class="history-list">
        {#each history as entry (entry.id)}
          <div class="history-item" transition:fade>
            <div class="history-info">
              <span class="file-name">{entry.fileName}</span>
              <span class="date">{entry.date}</span>
            </div>
            <span class="count">+{entry.count}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .card {
    width: 100%;
    max-width: 100%; /* Menyesuaikan dengan lebar Side Panel */
    background: var(--surface);
    border: none; /* Hilangkan border di Side Panel untuk tampilan lebih bersih */
    border-radius: 0; /* Menempel ke pinggir di Side Panel */
    padding: 1.5rem; /* Kurangi sedikit padding agar hemat ruang */
    min-height: 100vh; /* Agar memenuhi seluruh Side Panel */
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    box-shadow: none; /* Tidak butuh bayangan di Side Panel */
  }

  /* Jika dijalankan di Popup (lebar biasanya < 400px), beri radius lagi */
  @media (max-width: 600px) {
    :global(body) { padding: 0; } /* Gunakan :global untuk menargetkan body */
  }

  header {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    position: relative;
  }

  .header-text { flex: 1; min-width: 0; }

  .icon-wrap {
    flex-shrink: 0;
    width: 52px;
    height: 52px;
    background: var(--accent-light);
    color: var(--accent);
    border-radius: 14px;
    display: grid;
    place-items: center;
  }

  h1 {
    margin: 0 0 .25rem;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-heading);
    letter-spacing: -0.01em;
  }

  .subtitle {
    margin: 0;
    font-size: .875rem;
    color: var(--text-muted);
    line-height: 1.45;
  }

  .reset-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    transition: all .2s;
  }
  .reset-btn:hover { background: var(--border); color: var(--text-heading); }

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: .85em;
    background: var(--accent-light);
    color: var(--accent);
    padding: 2px 4px;
    border-radius: 4px;
  }

  /* Dropzone */
  .dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .75rem;
    border: 2px dashed var(--border);
    border-radius: 16px;
    padding: 3rem 1.5rem;
    cursor: pointer;
    transition: all .25s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: center;
    background: rgba(var(--accent-light), 0.3);
  }
  .dropzone:hover, .dropzone.active {
    border-color: var(--accent);
    background: var(--accent-light);
    transform: translateY(-2px);
  }
  .dropzone.active { scale: 1.02; border-style: solid; }
  .dropzone input { display: none; }

  .drop-circle {
    width: 64px;
    height: 64px;
    background: var(--surface);
    border-radius: 50%;
    display: grid;
    place-items: center;
    box-shadow: var(--shadow);
    color: var(--text-muted);
    transition: all .25s;
    margin-bottom: .5rem;
  }
  .dropzone:hover .drop-circle, .dropzone.active .drop-circle {
    color: var(--accent);
    box-shadow: 0 0 0 4px var(--accent-border);
  }

  .drop-label { margin: 0; font-size: 1rem; color: var(--text); }
  .drop-label strong { color: var(--accent); }
  .or { font-size: .8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

  .browse-btn {
    font-size: .875rem;
    font-weight: 600;
    color: var(--accent);
    background: var(--surface);
    border: 1px solid var(--accent-border);
    border-radius: 8px;
    padding: .5rem 1.25rem;
    box-shadow: var(--shadow);
    transition: all .2s;
  }
  .dropzone:hover .browse-btn { border-color: var(--accent); background: var(--accent-light); }

  /* Status */
  .status {
    display: flex;
    align-items: center;
    gap: .75rem;
    font-size: .875rem;
    font-weight: 600;
    padding: .85rem 1.25rem;
    border-radius: 12px;
    border: 1px solid transparent;
  }
  .status.loading { background: var(--accent-light); color: var(--accent); border-color: var(--accent-border); }
  .status.success { background: var(--success-light); color: var(--success); border-color: color-mix(in srgb, var(--success) 20%, transparent); }
  .status.error   { background: var(--error-light);   color: var(--error);   border-color: color-mix(in srgb, var(--error) 20%, transparent); }

  .spinner {
    width: 16px; height: 16px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin .7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Preview */
  .preview {
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    max-height: 380px;
    overflow-y: auto;
    background: var(--surface);
  }

  details { border-bottom: 1px solid var(--border); }
  details:last-child { border-bottom: none; }

  summary {
    display: flex;
    align-items: center;
    gap: .75rem;
    padding: .85rem 1.25rem;
    cursor: pointer;
    font-size: .9rem;
    font-weight: 600;
    color: var(--text-heading);
    list-style: none;
    user-select: none;
    transition: background .2s;
  }
  summary::-webkit-details-marker { display: none; }
  summary:hover { background: var(--accent-light); }
  
  .folder-icon { color: var(--accent); flex-shrink: 0; opacity: 0.8; }
  summary span:nth-child(2) { flex: 1; }

  .badge {
    font-size: .75rem;
    font-weight: 700;
    background: var(--bg);
    color: var(--text-muted);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 1px 6px;
    margin-right: 4px;
  }

  .chevron {
    color: var(--text-muted);
    transition: transform .3s;
    opacity: 0.5;
  }
  details[open] .chevron { transform: rotate(180deg); opacity: 1; color: var(--accent); }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    background: color-mix(in srgb, var(--bg) 50%, transparent);
  }
  li {
    display: flex;
    align-items: center;
    gap: .75rem;
    padding: .6rem 1.25rem .6rem 2.75rem;
    border-top: 1px solid var(--border);
    min-width: 0;
    transition: background .15s;
  }
  li:hover { background: var(--surface); }
  .favicon { flex-shrink: 0; filter: grayscale(0.2); transition: filter .2s; }
  li:hover .favicon { filter: grayscale(0); }
  li a {
    font-size: .85rem;
    color: var(--text);
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  li a:hover { color: var(--accent); text-decoration: underline; }

  /* Options Bar */
  .options-bar {
    background: var(--bg);
    padding: 1rem;
    border-radius: 12px;
    border: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: .75rem;
  }

  .option-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    font-size: .85rem;
    font-weight: 600;
  }

  select {
    flex: 1;
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: .35rem .5rem;
    font-size: .8rem;
    outline: none;
  }
  select:focus { border-color: var(--accent); }

  .toggle {
    display: flex;
    align-items: center;
    gap: .75rem;
    cursor: pointer;
    font-size: .85rem;
    font-weight: 600;
    color: var(--text);
  }

  .toggle input { display: none; }
  .slider {
    width: 32px; height: 18px;
    background: var(--text-muted);
    border-radius: 20px;
    position: relative;
    transition: background .2s;
  }
  .slider::before {
    content: '';
    position: absolute;
    width: 14px; height: 14px;
    background: white;
    border-radius: 50%;
    top: 2px; left: 2px;
    transition: transform .2s;
  }
  .toggle input:checked + .slider { background: var(--accent); }
  .toggle input:checked + .slider::before { transform: translateX(14px); }

  /* Chrome Import Button */
  .import-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .65rem;
    width: 100%;
    background: var(--surface);
    color: var(--accent);
    border: 2px solid var(--accent);
    border-radius: 12px;
    padding: .85rem 1.5rem;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all .2s;
  }
  .import-btn:hover { background: var(--accent-light); transform: translateY(-1px); }
  .import-btn:active { transform: translateY(0); }

  /* Download button */
  .download-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .65rem;
    width: 100%;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 1rem 1.5rem;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all .2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent);
  }
  .download-btn:hover { background: var(--accent-hover); transform: translateY(-1px); box-shadow: 0 6px 16px color-mix(in srgb, var(--accent) 40%, transparent); }
  .download-btn:active { transform: translateY(0); }

  .hint {
    margin: 0;
    font-size: .825rem;
    color: var(--text-muted);
    text-align: center;
  }
  .hint code { background: var(--border); color: var(--text); }

  /* History Section */
  .history-section {
    margin-top: 1rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .history-header h2 {
    font-size: .875rem;
    font-weight: 700;
    color: var(--text-heading);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: .05em;
  }

  .clear-btn {
    background: transparent;
    border: none;
    color: var(--accent);
    font-size: .75rem;
    font-weight: 600;
    cursor: pointer;
    padding: 2px 8px;
    border-radius: 4px;
  }
  .clear-btn:hover { background: var(--accent-light); }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: .5rem;
  }

  .history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg);
    padding: .65rem .85rem;
    border-radius: 8px;
    border: 1px solid var(--border);
  }

  .history-info {
    display: flex;
    flex-direction: column;
    gap: .1rem;
    min-width: 0;
  }

  .file-name {
    font-size: .8rem;
    font-weight: 600;
    color: var(--text-heading);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .date {
    font-size: .7rem;
    color: var(--text-muted);
  }

  .count {
    font-size: .75rem;
    font-weight: 800;
    color: var(--success);
    background: var(--success-light);
    padding: 2px 8px;
    border-radius: 99px;
  }
</style>
