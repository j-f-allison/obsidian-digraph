# Log

Running history of decisions and work. **Newest entry at the top.** Append a dated
entry after each meaningful chunk of work: what changed, what was decided, what's
verified, what's next.

---

## 2026-06-10 — Stage 3 complete (Sonnet 4.6)

**What changed:**

- `settings.ts` (new) — `VimDigraphSettings` interface + defaults + `DigraphSettingTab`.
  Settings: `cmdlineDigraphs` (off by default), `bsDigraphs` (off by default),
  `customDigraphs: Record<string,string>`. Custom digraphs override built-in ones
  with the same code. Settings persisted via `loadData`/`saveData`.
- `capture.ts` — significant rewrite:
  - `CaptureMode: 'editor' | 'cmdline'` tracks where the active capture was triggered.
  - New state `BS_AWAIT2`: entered when `bsDigraphs` is enabled, the user types a
    char then presses Backspace, and the char before cursor matches the tracked char.
    The Backspace is consumed; if a digraph is found the char is deleted and the
    digraph inserted; if unknown the deferred Backspace fires and char2 types normally.
  - Ctrl-K now also fires in command-line mode (when `cmdlineDigraphs` is on):
    checks `isVimCommandLineActive()` in addition to `isInInsertMode()`.
  - `lookup()` merges `customDigraphs` (takes priority) with `DIGRAPHS`.
  - `performBackspace()` helper deletes one character before the cursor via
    `replaceRange`.
  - Constructor now takes `settings: VimDigraphSettings` as a third argument.
- `vim-bridge.ts` — added `isVimCommandLineActive()` (checks `document.activeElement`
  inside `.cm-vim-panel`) and `insertIntoCommandLine()` (manipulates the input value
  at the selection cursor and dispatches an `input` event).
- `main.ts` — loads and saves settings (`loadData`/`saveData`), registers
  `DigraphSettingTab`, passes `this.settings` to `DigraphCapture`.
- `styles.css` — styles for the custom digraphs settings UI (add form + list).

**Design decisions:**
- `bsDigraphs` and `cmdlineDigraphs` are off by default to preserve existing
  behavior for users who don't want these features.
- `lastTypedChar` tracking only applies when `bsDigraphs` is enabled, to avoid
  unnecessary overhead.
- For `BS_AWAIT2` + Escape: the Backspace fires (char1 deleted) and Escape is
  NOT prevented, so Vim exits insert mode normally.
- For `BS_AWAIT2` + non-printable key (Tab, Enter, arrow): the Backspace fires
  and the non-printable key passes through.
- The command-line class selector `.cm-vim-panel` is best-effort (undocumented
  Obsidian/CM6 vim internal); `isVimCommandLineActive` silently returns false if
  the element structure changes.

**Verified:** `npm run build` passes clean.

**Not yet verified in vault:** settings tab UI, `bsDigraphs` entry, command-line
mode Ctrl-K, custom digraph override.

---

## 2026-06-10 — Stage 3 partial: cursor hint + :digraphs modal (Sonnet 4.6)

**What changed:**

- `cursor-hint.ts` (new) — CM6 `StateField` + `WidgetDecoration` that renders a
  greyed-out `?` at the cursor while the state machine is in AWAIT1 or AWAIT2.
  Cleared on reset and on any document/selection change (mouse click etc.).
- `digraphs-modal.ts` (new) — Obsidian `Modal` with a search input and a scrollable
  table (code | char | codepoint) of all 1276 digraphs. Filtering matches on
  digraph code substring or exact character value.
- `vim-bridge.ts` — added `getCm6` (returns the CM6 `EditorView`) and
  `defineVimExCommand` (registers a Vim Ex command via `Vim.defineEx`).
- `capture.ts` — calls `setDigraphHint(cm6, true)` on Ctrl-K and
  `setDigraphHint(cm6, false)` on reset.
- `main.ts` — `registerEditorExtension([digraphCursorExtension])`, registers
  `show-digraph-table` command, wires `:digraphs` as a Vim Ex command
  (deferred to `onLayoutReady` so the Vim adapter is initialized).
- `styles.css` — styles for `.vim-digraph-cursor-hint` and the modal.

**n~ clarification:** `n~` is not a bug. Vim's RFC-1345 table uses `?` (question
mark) as the combining tilde diacritic marker, so ñ is `n?`, ã is `a?`, etc.
This is confirmed by the raw bytes in `digraph.txt`. Users expecting `n~` should
use `n?` instead. Note: nvim 0.12.2 does support both `n~` and `n?` as aliases
(nvim has duplicate entries; we deduplicate on first-by-codepoint). Leaving as-is
per user decision — if alias support is ever added it should live in the generator.

**:digraph vs :digraphs:** nvim accepts both `:digraph` and `:digraphs`. We only
register `:digraphs`; adding `:digraph` as an alias would be a one-liner in
`defineVimExCommand` but was explicitly left out.

**Verified:** `npm run build` passes clean.

**Not yet verified in vault:** cursor hint appearance, `:digraphs` Ex command
availability, modal search/filtering.

**Next:** test in dev vault; consider Stage 3 remaining items (`{c}<BS>{c}` entry,
settings tab, command-line mode digraphs).

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
