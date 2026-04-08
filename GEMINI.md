# Docx Bookmark Importer

A specialized Svelte 5 web application for converting Chrome bookmarks that were accidentally saved or exported as `.docx` files back into a standard, importable `.html` format (Netscape Bookmark file format).

## 🛠 Tech Stack
- **Framework:** Svelte 5 (utilizing `$state` and updated syntax)
- **Build Tool:** Vite
- **Libraries:** `jszip` for parsing `.docx` files
- **Styling:** Vanilla CSS with custom properties (CSS variables) and native dark mode support.

## 🏗 Project Structure
- `src/main.js`: Entry point for the Svelte application.
- `src/App.svelte`: Main UI component, handling file uploads, drag-and-drop, and preview logic.
- `src/lib/parser.js`: Core logic for DOCX parsing and HTML generation.
  - `parseDocxBookmarks(file)`: Extracts folder names (from Heading 3 styles) and hyperlinks from the DOCX XML structure.
  - `generateBookmarkHtml(structure)`: Produces the Netscape Bookmark HTML format.
- `src/app.css`: Global styles and color variables for light/dark themes.

## 🧩 Chrome Extension Mode
- **Manifest:** `public/manifest.json` (V3)
- **Native APIs:**
  - `chrome.bookmarks`: Direct import to browser.
  - `chrome.sidePanel`: Tool stays open on the right side of the browser.
  - `chrome.contextMenus`: Right-click any page to open the tool.
- **Build:** `pnpm build` generates the `dist` folder.

## 🗺️ Extension Roadmap
- [x] Phase 1: Native Integration
  - [x] Direct Bookmark Injection (Chrome Bookmarks API)
  - [x] Side Panel Support
  - [x] Background Service Worker & Context Menus
- [x] Phase 2: UX & Productivity
  - [ ] Smart Mapping (Pick target folder visually)
  - [x] Duplicate URL Detection (Toggle in UI)
  - [ ] History Log (Last 10 imports)
- [ ] Phase 3: Marketplace Readiness
  - [ ] Options & Settings Page
  - [ ] Internationalization (i18n)
  - [ ] Analytics & Usage Feedback (Privacy-focused)

## 📋 Conventions & Standards
- **Svelte 5:** Use Svelte 5 runes (`$state`, `$derived`, etc.) and the latest event handling syntax (`onclick` instead of `on:click`).
- **Transitions:** Use Svelte's built-in `fade` and `slide` transitions for a smooth UI experience.
- **Chrome Extension CSP:** Avoid inline scripts; Vite handles this via the current configuration.
- **CSS Variables:** Favor using the defined CSS variables in `app.css`.
- **Surgical Logic:** The DOCX parsing relies on regex matches against the internal XML (`word/document.xml`). When modifying the parser, ensure compatibility with standard Word XML structures.
- **No Heavy Dependencies:** Maintain the lightweight nature of the project. Avoid adding UI libraries; prefer Vanilla CSS and SVG icons.

## 🚀 Key Workflows
- **Parsing:** The tool expects "Heading 3" for folder names and standard hyperlinks for bookmark items.
- **Global Drag-and-Drop:** Users can drop `.docx` files anywhere on the window to start the conversion process.
- **Interactive Preview:** Shows a collapsible, animated view of the extracted structure with favicons.
- **Reset:** A "Reset" button allows users to quickly clear the current state and start a new conversion.
- **Export:** Generates a `bookmarks.html` file that can be imported directly into Chrome/Edge/Firefox via their bookmark managers.
