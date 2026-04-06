<script>
  import { parseDocxBookmarks, generateBookmarkHtml } from './lib/parser.js'

  let status = $state(null)   // { type: 'loading'|'success'|'error', text: string }
  let structure = $state([])
  let dragging = $state(false)

  async function handleFile(file) {
    if (!file) return
    if (!file.name.endsWith('.docx')) {
      status = { type: 'error', text: 'Please select a .docx file.' }
      return
    }
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

  function download() {
    const html = generateBookmarkHtml(structure)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    a.download = 'bookmarks.html'
    a.click()
  }

  function onDrop(e) {
    dragging = false
    handleFile(e.dataTransfer.files[0])
  }

  function onInputChange(e) {
    handleFile(e.target.files[0])
    e.target.value = ''
  }
</script>

<div class="card">
  <header>
    <div class="icon-wrap">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    </div>
    <div>
      <h1>Docx Bookmark Importer</h1>
      <p class="subtitle">Convert Chrome bookmarks accidentally saved as <code>.docx</code> back to importable <code>.html</code></p>
    </div>
  </header>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <label
    class="dropzone"
    class:active={dragging}
    ondragover={(e) => { e.preventDefault(); dragging = true }}
    ondragleave={() => dragging = false}
    ondrop={onDrop}
  >
    <svg class="drop-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="16 16 12 12 8 16"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
    <p class="drop-label">Drag & drop your <code>.docx</code> file here</p>
    <span class="or">or</span>
    <span class="browse-btn">Browse file</span>
    <input type="file" accept=".docx" onchange={onInputChange} />
  </label>

  {#if status}
    <div class="status {status.type}">
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
    <div class="preview">
      {#each structure as { folder, items }}
        <details>
          <summary>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z"/></svg>
            <span>{folder}</span>
            <span class="badge">{items.length}</span>
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

    <button class="download-btn" onclick={download}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Download bookmarks.html
    </button>

    <p class="hint">
      Import: open <code>chrome://bookmarks/</code> → <code>⋮</code> → <strong>Import bookmarks</strong>
    </p>
  {/if}
</div>

<style>
  .card {
    width: 100%;
    max-width: 600px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 2rem;
    box-shadow: var(--shadow-md);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .icon-wrap {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    background: var(--accent-light);
    color: var(--accent);
    border-radius: 12px;
    display: grid;
    place-items: center;
  }

  h1 {
    margin: 0 0 .2rem;
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--text-heading);
    line-height: 1.3;
  }

  .subtitle {
    margin: 0;
    font-size: .85rem;
    color: var(--text-muted);
    line-height: 1.5;
  }

  code {
    font-family: ui-monospace, Consolas, monospace;
    font-size: .8em;
    background: var(--accent-light);
    color: var(--accent);
    padding: 1px 5px;
    border-radius: 4px;
  }

  /* Dropzone */
  .dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .5rem;
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    padding: 2rem 1rem;
    cursor: pointer;
    transition: border-color .2s, background .2s;
    text-align: center;
  }
  .dropzone:hover, .dropzone.active {
    border-color: var(--accent);
    background: var(--accent-light);
  }
  .dropzone input { display: none; }

  .drop-icon { color: var(--text-muted); }
  .dropzone:hover .drop-icon, .dropzone.active .drop-icon { color: var(--accent); }

  .drop-label { margin: 0; font-size: .9rem; color: var(--text); }
  .or { font-size: .8rem; color: var(--text-muted); }

  .browse-btn {
    font-size: .85rem;
    font-weight: 500;
    color: var(--accent);
    background: var(--accent-light);
    border: 1px solid var(--accent-border);
    border-radius: 6px;
    padding: .35rem .9rem;
    transition: background .15s;
  }
  .dropzone:hover .browse-btn { background: var(--accent-border); }

  /* Status */
  .status {
    display: flex;
    align-items: center;
    gap: .5rem;
    font-size: .875rem;
    font-weight: 500;
    padding: .65rem 1rem;
    border-radius: var(--radius);
    border: 1px solid transparent;
  }
  .status.loading { background: var(--accent-light); color: var(--accent); border-color: var(--accent-border); }
  .status.success { background: var(--success-light); color: var(--success); border-color: color-mix(in srgb, var(--success) 30%, transparent); }
  .status.error   { background: var(--error-light);   color: var(--error);   border-color: color-mix(in srgb, var(--error) 30%, transparent); }

  .spinner {
    width: 14px; height: 14px;
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
    border-radius: var(--radius);
    overflow: hidden;
    max-height: 320px;
    overflow-y: auto;
  }

  details {
    border-bottom: 1px solid var(--border);
  }
  details:last-child { border-bottom: none; }

  summary {
    display: flex;
    align-items: center;
    gap: .5rem;
    padding: .65rem 1rem;
    cursor: pointer;
    font-size: .875rem;
    font-weight: 600;
    color: var(--text-heading);
    list-style: none;
    user-select: none;
    transition: background .15s;
  }
  summary::-webkit-details-marker { display: none; }
  summary:hover { background: var(--accent-light); }
  summary svg { color: var(--accent); flex-shrink: 0; }
  summary span:nth-child(2) { flex: 1; }

  .badge {
    font-size: .75rem;
    font-weight: 500;
    background: var(--accent-light);
    color: var(--accent);
    border: 1px solid var(--accent-border);
    border-radius: 99px;
    padding: 1px 8px;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    background: var(--bg);
  }
  li {
    display: flex;
    align-items: center;
    gap: .5rem;
    padding: .4rem 1rem .4rem 2.25rem;
    border-top: 1px solid var(--border);
    min-width: 0;
  }
  .favicon { flex-shrink: 0; opacity: .8; }
  li a {
    font-size: .82rem;
    color: var(--text);
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color .15s;
  }
  li a:hover { color: var(--accent); text-decoration: underline; }

  /* Download button */
  .download-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .5rem;
    width: 100%;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: var(--radius);
    padding: .75rem 1.5rem;
    font-size: .95rem;
    font-weight: 600;
    cursor: pointer;
    transition: background .15s, transform .1s;
  }
  .download-btn:hover { background: var(--accent-hover); }
  .download-btn:active { transform: scale(.98); }

  .hint {
    margin: 0;
    font-size: .8rem;
    color: var(--text-muted);
    text-align: center;
  }
  .hint strong { color: var(--text); }
</style>
