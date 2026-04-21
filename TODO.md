# Schizo — TODO

## Completed

### Foundation
- [x] Project scaffold (Tauri 2 + React + TypeScript + Vite)
- [x] Infinite canvas with pan and zoom
- [x] Cork board background texture (CSS)
- [x] Note, Image, Link, Screenshot, Video item types (components + types)
- [x] Pin handles on items
- [x] Rope physics (Verlet integration, sag, catenary initial shape)
- [x] Pin-to-pin connections (drag from pin to pin)
- [x] String styles (thread, yarn, wire, rope)
- [x] SQLite persistence (PlatformAdapter with TauriAdapter + WebAdapter fallback)
- [x] Multiple boards (create, rename, delete, switch — fully persisted)
- [x] Ollama AI chat panel + settings
- [x] Board switcher sidebar

### MVP Polish
- [x] Image drag-and-drop to add image items
- [x] GPL v3 `LICENSE` file
- [x] Note editing (double-click to edit text)
- [x] Hover tooltips on all toolbar/UI buttons
- [x] Inline board rename (double-click board name)
- [x] String/item z-order (strings behind items; click brings item to front)
- [x] Delete selected items with Delete/Backspace key

---

## Remaining

### MVP
- [ ] Interactive testing via `npm run tauri dev`

### V1
- [x] Per-connection string style picker (click rope to open style panel)
- [x] Item labels (caption)
- [x] Item resize handles
- [x] Multi-select (shift-click, rubber-band drag)
- [x] Undo / redo (50 steps)
- [x] Context menu (right-click: delete item, duplicate, edit label)
- [x] Export board as PNG (toolbar 🖼️ button, html2canvas)
- [x] Link item OG preview fetch (title, description, favicon, thumbnail)
- [x] PWA support (manifest + service worker + icon)

### V1.5
- [x] YouTube / Vimeo video embed items
- [x] Full-text search across all boards
- [x] Keyboard shortcuts (N=note, L=link, C=connect mode, Cmd+Z=undo)
- [x] Rope "sleep" optimization (skip inactive ropes)

### V2
- [ ] Nested boards (double-click item → sub-board)
- [ ] Mobile target (Tauri 2 iOS/Android)
- [ ] Board templates (Cold Case, Research, Mood Board…)
- [ ] Onboarding example board

### V3
- [ ] Local-network collaboration (mDNS peer discovery + CRDTs)
