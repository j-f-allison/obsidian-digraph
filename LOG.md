# Log

Running history of decisions and work. **Newest entry at the top.** Append a dated
entry after each meaningful chunk of work: what changed, what was decided, what's
verified, what's next.

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
