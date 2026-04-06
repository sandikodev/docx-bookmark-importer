<script>
  import { parseDocxBookmarks, generateBookmarkHtml } from './lib/parser.js'

  let status = ''
  let structure = []
  let dragging = false

  async function handleFile(file) {
    if (!file || !file.name.endsWith('.docx')) {
      status = 'Please select a .docx file'
      return
    }
    status = 'Parsing...'
    try {
      structure = await parseDocxBookmarks(file)
      const total = structure.reduce((n, f) => n + f.items.length, 0)
      status = `Found ${total} bookmarks in ${structure.length} folders`
    } catch (e) {
      status = 'Error: ' + e.message
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
</script>

<main>
  <h1>Docx → Bookmark Importer</h1>
  <p>Convert Chrome bookmark export saved as <code>.docx</code> back to importable <code>.html</code></p>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="dropzone"
    class:active={dragging}
    ondragover={(e) => { e.preventDefault(); dragging = true }}
    ondragleave={() => dragging = false}
    ondrop={onDrop}
  >
    <p>Drag & drop your <code>.docx</code> file here</p>
    <p>or</p>
    <input type="file" accept=".docx" onchange={(e) => handleFile(e.target.files[0])} />
  </div>

  {#if status}
    <p class="status">{status}</p>
  {/if}

  {#if structure.length > 0}
    <div class="preview">
      {#each structure as { folder, items }}
        <details>
          <summary>📁 {folder} ({items.length})</summary>
          <ul>
            {#each items as { title, url }}
              <li><a href={url} target="_blank">{title}</a></li>
            {/each}
          </ul>
        </details>
      {/each}
    </div>
    <button onclick={download}>⬇ Download bookmarks.html</button>
  {/if}
</main>

<style>
  main { max-width: 640px; margin: 2rem auto; font-family: sans-serif; padding: 0 1rem; }
  h1 { font-size: 1.4rem; }
  .dropzone {
    border: 2px dashed #aaa; border-radius: 8px;
    padding: 2rem; text-align: center; cursor: pointer;
    transition: border-color .2s;
  }
  .dropzone.active { border-color: #4f46e5; background: #eef2ff; }
  .status { font-weight: bold; color: #4f46e5; }
  .preview { margin: 1rem 0; max-height: 300px; overflow-y: auto; border: 1px solid #eee; border-radius: 6px; padding: .5rem; }
  details { margin: .25rem 0; }
  summary { cursor: pointer; font-weight: 600; }
  ul { margin: .25rem 0 .25rem 1.5rem; }
  li { font-size: .85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  button { background: #4f46e5; color: white; border: none; padding: .6rem 1.4rem; border-radius: 6px; cursor: pointer; font-size: 1rem; }
  button:hover { background: #4338ca; }
</style>
