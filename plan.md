# Schizo — Project Plan

> A corkboard note-taking app inspired by the classic movie trope: photos, notes, articles, and web links pinned to a board and connected by strings. Fully local, privacy-first, open source.

## Vision

Schizo lets you think visually. Drop anything onto a board — a note, a screenshot, a web link, a video clip — pin it down, and connect it to other things with string. The string has real physics: it sags, swings when you drag something, and settles naturally. Create as many boards as you need to keep topics separate.

Everything stays on your machine. No accounts, no telemetry, no cloud. Your data is a local SQLite file you can back up however you like.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Tauri 2.x (Rust backend, WebView frontend) |
| Frontend | React 19 + TypeScript + Vite |
| Canvas / strings | PixiJS (WebGL overlay) |
| Physics | Custom Verlet rope simulation |
| Storage | SQLite via tauri-plugin-sql |
| State | Zustand |
| Styling | Tailwind CSS + CSS custom properties |
| AI | Ollama (user-hosted, local — `http://localhost:11434`) |
| License | MIT |

---

## Feature Status

### ✅ Built
- Project scaffold (Tauri 2 + React + TypeScript + Vite)
- Infinite canvas with pan and zoom
- Cork board background texture (CSS)
- Note, Image, Link, Screenshot, Video item types (components + types)
- Pin handles on items
- Rope physics (Verlet integration, sag, catenary initial shape)
- Pin-to-pin connections (drag from pin to pin)
- String styles (thread, yarn, wire, rope)
- SQLite persistence (PlatformAdapter with TauriAdapter + WebAdapter fallback)
  - Auto-save (1.5s debounce) on item/connection/viewport changes
  - Load saved boards on startup; create default board on first run
- Multiple boards (create, rename, delete, switch — fully persisted)
- Ollama AI chat panel + settings (board context → local model)
- Board switcher sidebar

### 🔨 Building
*(none in progress)*

### 📋 Planned

#### MVP remaining / polish
- [ ] Image drag-and-drop to add image items
- [ ] Interactive testing via `npm run tauri dev`

#### V1
- [ ] Per-connection string style picker (color, texture, slack)
- [ ] Item labels (caption)
- [ ] Item resize handles
- [ ] Multi-select (shift-click, rubber-band drag)
- [ ] Undo / redo (50 steps)
- [ ] Context menu (delete item, delete connection, edit label)
- [ ] Export board as PNG
- [ ] PWA support (manifest + service worker)
- [ ] Link item OG preview fetch (title, description, thumbnail via Rust HTTP)

#### V1.5
- [ ] YouTube / Vimeo video embed items
- [ ] Full-text search across all boards
- [ ] Keyboard shortcuts (N=note, L=link, C=connect mode, Del=delete, Cmd+Z=undo)
- [ ] Rope "sleep" optimization (skip inactive ropes)

#### V2
- [ ] Nested boards (double-click item → sub-board)
- [ ] Mobile target (Tauri 2 iOS/Android)
- [ ] Board templates (Cold Case, Research, Mood Board…)
- [ ] Onboarding example board

#### V3
- [ ] Local-network collaboration (mDNS peer discovery + CRDTs — no cloud required)

---

## Privacy Guarantee

- **No telemetry.** No analytics. No crash reporting to any server.
- **No cloud calls** unless you explicitly trigger them:
  - Link previews: fetched by the local Rust backend on demand
  - AI: sent only to your own Ollama server at the URL you configure
- **All data** is stored in a local SQLite file (`~/.local/share/schizo/schizo.db` on Linux, `~/Library/Application Support/schizo/schizo.db` on Mac, `%APPDATA%\schizo\schizo.db` on Windows)
- **Open source** under the MIT License — read the code, audit it, fork it

---

## Architecture Notes

### Two-layer rendering
Items (notes, images, links) live in the DOM as absolutely-positioned divs inside a CSS `transform: translate/scale` viewport container. String ropes and pin halos live in a full-screen PixiJS (WebGL) canvas overlay. Both layers share a single `viewport` object in Zustand so coordinates never drift.

### Rope physics
Each string is simulated as N point masses (nodes) connected by distance constraints. Algorithm:
1. **Verlet integrate** each free node (carries implicit velocity via `x - prevX`)
2. **Anchor** endpoints to their item pins each frame
3. **Relax constraints** 5 iterations per frame
4. **Render** a smooth catmull-rom curve through the nodes

Physics is cheap: 50 connections × 12 nodes × 5 iterations = 3000 simple distance calculations per frame (~0.1ms).

### Platform adapter
All Tauri invocations go through a `PlatformAdapter` interface. The `TauriAdapter` calls `invoke()`. The `WebAdapter` uses `sql.js` + Origin Private File System for the browser/PWA target. App code never calls Tauri directly.

### Ollama integration
The Ollama chat panel builds a context string from all items on the current board (note text, link titles/descriptions, item labels) and sends it as a system prompt to `POST /api/chat` on the user's Ollama server. Fully local. No data leaves the machine.
