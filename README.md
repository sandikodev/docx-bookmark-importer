<div align="center">
  <img src="public/logo.svg" width="128" height="128" alt="Docx Bookmark Importer Logo" />
  <h1>Docx Bookmark Importer</h1>
  <p><em>Advanced conversion tool for .docx bookmark recovery.</em></p>

  <img src="public/mascot.svg" width="256" alt="Byte-Bot Assistant" />
  
  <p>
    <img src="https://img.shields.io/badge/Author-sandikodev-6366F1?style=for-the-badge" alt="Author sandikodev" />
    <img src="https://img.shields.io/badge/Svelte-5-ff3e00?style=for-the-badge&logo=svelte" alt="Svelte 5" />
    <img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
    <img src="https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=google-chrome" alt="Chrome Extension" />
  </p>
</div>

<hr />

## 🛠 Project Overview
**Docx Bookmark Importer** is a high-performance utility designed to parse internal XML structures of `.docx` files to extract bookmarks and export them as a standard, importable Netscape HTML file. This tool is specifically built to recover bookmarks that were accidentally saved or exported into Microsoft Word format.

## ✨ Core Capabilities
- **Precision Extraction:** Advanced parsing of Word's internal hyperlink and heading (`w:pStyle w:val="Heading3"`) structures.
- **Modern Architecture:** Built with **Svelte 5 (Runes)** for reactive performance and minimal bundle size.
- **Seamless Workflow:** Global window drag-and-drop listener allows for instant file processing.
- **Privacy-Centric:** 100% local execution. No server-side processing or data transmission.
- **Dark Mode Support:** Fully responsive and themed for both light and dark system preferences.

## 🚀 Deployment & Installation

### Web Interface
1. Clone the repository.
2. `pnpm install`
3. `pnpm dev`

### Chrome Extension
1. Build assets: `pnpm build`
2. Navigate to `chrome://extensions/` in your browser.
3. Enable **Developer Mode**.
4. Click **Load unpacked** and select the `dist` folder.

## 📋 Technology Stack
- **Framework:** Svelte 5
- **Parsing Engine:** JSZip & Custom XML Parser
- **Build Tool:** Vite 6
- **Styling:** Vanilla CSS (Custom Properties)

<hr />
<div align="center">
  <p>Maintained and Authored by <strong>sandikodev</strong></p>
</div>
