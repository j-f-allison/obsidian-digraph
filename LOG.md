# Log

Running history of decisions and work. **Newest entry at the top.** Append a dated
entry after each meaningful chunk of work: what changed, what was decided, what's
verified, what's next.

---

## 2026-06-10 — Stage 2: full digraph table (Sonnet 4.6)

Stage 1 acceptance criteria verified in a real vault by the user. Implemented Stage 2.

**What changed:**
- `scripts/gen-digraphs.mjs` — new Node.js script that fetches `runtime/doc/digraph.txt`
  from `vim/vim` on GitHub, parses both the ASCII (`digraph-table`) and Unicode
  (`digraph-table-mbyte`) sections, skips control characters (0x00–0x1F, 0x7F),
  deduplicates on digraph key, sorts by codepoint, and writes `digraphs.ts`.
- `digraphs.ts` — replaced the 4-entry Stage 1 stub with the auto-generated 1276-entry
  full Vim table. Header comment instructs maintainers to regenerate, not hand-edit.
- `package.json` — added `"gen": "node scripts/gen-digraphs.mjs"` script.

**Verified:** `npm run gen` produces 1276 digraphs; `npm run build` passes clean;
all four Stage 1 entries (`e'`→`é`, `e!`→`è`, `->`→`→`, `<-`→`←`) are present.

**Open decisions (§6, unchanged):** unknown digraph → cancel silently; reverse-order
codes → exact order only. Both remain as Stage 2 defaults, revisit in Stage 3.

**Next:** test the full table in a dev vault; optionally begin Stage 3
(command-line mode, settings tab, `{c}<BS>{c}` entry).

---

## 2026-06-10 — Stage 1 implementation (Sonnet 4.6)

Scaffolded and implemented the full Stage 1 MVP. All files created; `tsc -noEmit`
passes clean; production build produces `main.js` (3.4 KB).

**Files created:**
- `manifest.json`, `versions.json`, `styles.css` — plugin metadata/assets
- `package.json`, `tsconfig.json` (strict), `esbuild.config.mjs` — build tooling
  (TypeScript 5.4.5, esbuild 0.21.5)
- `digraphs.ts` — hardcoded Stage 1 map: `e'`→`é`, `e!`→`è`, `->`→`→`, `<-`→`←`
- `statusbar.ts` — `DigraphStatusBar` wrapping the Obsidian status-bar `HTMLElement`
- `vim-bridge.ts` — single module for all undocumented internals; `isInInsertMode`
  reads `cm5.state.vim.insertMode` via `editMode?.editor?.cm?.cm`
- `capture.ts` — `DigraphCapture` IDLE→AWAIT1→AWAIT2 state machine; capture-phase
  DOM keydown handler; cancels on Esc, on mode change, or on unknown code
- `main.ts` — `VimDigraphsPlugin extends Plugin`; wires statusbar + capture;
  registers one `document` keydown listener in capture phase

**Decisions made during implementation:**
- During AWAIT1/AWAIT2, mode is re-checked on every keydown (rather than via a
  `vim-mode-change` listener) — sufficient for Stage 1 since Esc (the normal
  exit) is caught by the state machine itself; the listener approach is deferred.
- Pure modifier keydowns (Control, Shift, Alt, Meta) are ignored (not consumed)
  during capture, per CLAUDE.md spec.

**Not yet verified:** acceptance criteria require a real Obsidian vault — see
CLAUDE.md §Testing. Install: symlink this directory into
`<vault>/.obsidian/plugins/vim-digraphs/`, enable the plugin, walk PROJECT.md §7.

**Next:** test in a dev vault against the Stage 1 acceptance criteria.

---

## 2026-06-10 — Repo prep (Sonnet 4.6)

Added `.gitignore` for the TypeScript/esbuild Obsidian plugin layout: ignores
`node_modules/`, build output (`main.js`, `*.js.map`), `.hotreload`, OS/editor
noise, and any dev vault directory. Doc files and future source files are tracked.

**Next:** scaffold the plugin from `obsidian-sample-plugin` and implement Stage 1.

---

## 2026-06-10 — Planning & handoff (Opus 4.8)

Planned the project; no code yet. Created `PROJECT.md` (scope/decisions) and
`CLAUDE.md` (implementer's guide).

**Research findings**
- Obsidian Vim mode = bundled CodeMirror-6 vim adapter. Reachable objects:
  vim at `window.CodeMirrorAdapter.Vim`; CM5-compat editor at
  `view.editMode.editor.cm.cm`; CM6 `EditorView` at `view.editMode.editor.cm`.
  Mode changes fire a `'vim-mode-change'` event. (Confirmed via `obsidian-vimrc-support`.)
- Digraphs are **not** implemented by Obsidian or `replit/codemirror-vim` — we
  must capture `Ctrl-K` + two keys ourselves.
- Digraph codes confirmed against Vim's table: `e'`→`é`, `e!`→`è`, `->`→`→`, `<-`→`←`.
  All Vim digraphs are 2-char codes → ~1 output char; entered in insert/command-line
  mode. (Source: vimhelp.org/digraph.txt.html)

**Decisions (from the requester)**
- Trigger: `Ctrl-K`, **insert mode only** (faithful to Vim; not normal mode as
  first described — confirmed with requester).
- Feedback: **status-bar indicator** during capture.
- Staged delivery: Stage 1 MVP (tiny hardcoded map: `é`, `→`, `←`) → Stage 2 full
  table → Stage 3 command-line mode / settings. See `PROJECT.md`.

**Deferred (defaults set in PROJECT.md §6):** unknown-digraph behavior (cancel
silently), reverse-order codes (off), command-line mode, `{c}<BS>{c}` entry.

**Next:** scaffold the plugin (from `obsidian-sample-plugin`) and implement Stage 1
per `PROJECT.md` §4 and the capture approach in `CLAUDE.md`. Verify against the
Stage 1 acceptance criteria (`PROJECT.md` §7).
