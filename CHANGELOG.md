# Changelog

## Unreleased

### Added
- Nested boards: create sub-board portal items (`B` shortcut or 🗂️ toolbar button) that link to a child board. Double-click a portal card to navigate into the sub-board. A breadcrumb button in the top-left lets you navigate back to the parent board.
- Board templates: "New Board" now opens a dialog with a name field and four template choices (Empty, Cold Case, Research, Mood Board); each template pre-populates the board with labelled notes and connected strings.
- Onboarding example board: first-run now seeds a pre-populated "Welcome Board" with five annotated sticky notes and string connections, demonstrating notes, shortcuts, multi-board navigation, and the privacy model.

## [1.5.0] — 2026-04

### Added
- Full-text search across all boards (`⌘K` / `🔍` toolbar button)
- YouTube / Vimeo video embed items (`V` shortcut, 🎬 toolbar button)
- Rope physics sleep optimization — idle ropes skip WebGL render entirely
- PWA support: `manifest.webmanifest`, cache-first service worker, cork-board icon
- Export board as PNG (📷 toolbar button, html2canvas)
- Link item OG preview auto-fetch (title, description, favicon, thumbnail)
- Per-connection string style picker (click rope to open panel)
- Item labels / captions
- Item resize handles
- Multi-select (shift-click + rubber-band marquee drag)
- Undo / redo (50 steps, `⌘Z` / `⌘⇧Z`)
- Context menu (right-click: delete, duplicate, edit label)
- Keyboard shortcuts: `N` note, `L` link, `C` connect, `V` video, `Del` delete, `⌘K` search

## [1.0.0] — 2026-03

### Added
- Infinite canvas with pan / zoom
- Cork board background texture
- Note, Image, Link, Screenshot, Video item types
- Pin handles and rope physics (Verlet integration, catenary initial shape)
- String styles: thread, yarn, wire, rope
- SQLite persistence via PlatformAdapter (Tauri + PWA/web targets)
- Multiple boards (create, rename, delete, switch)
- Ollama AI chat panel (local model, board context as system prompt)
- Board switcher sidebar
- Image drag-and-drop
- Note double-click to edit
- Inline board rename (double-click board name)
- String z-order (strings render behind items)
