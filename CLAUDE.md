# CLAUDE.md — implementer's guide

Guidance for implementing this plugin. **Read `PROJECT.md` first** for scope and
decisions; keep `LOG.md` updated as you work.

## What this is
An Obsidian plugin reproducing Vim/Neovim `Ctrl-K` digraphs in Obsidian's Vim
mode (insert mode). Current target is **Stage 1 (MVP)** — see `PROJECT.md` §4.

## Working agreement
- **Stay within the current stage.** Don't build Stage 2/3 features unless asked;
  if you find you need something from a later stage, note it in `LOG.md` and flag it.
- **Append to `LOG.md`** after each meaningful chunk of work: what you did, what
  you decided, what's verified, what's next. Newest entry at the top.
- **Verify in a real vault**, not just by compiling — the integration touches
  undocumented Obsidian internals (see Gotchas).
- Obsidian internals used here are **untyped and version-sensitive**. Keep every
  `as any` / undocumented access isolated in one small module (e.g. `vim-bridge.ts`)
  so breakage is contained and easy to audit.

## Tech stack & target layout (to be created)
Standard Obsidian plugin, TypeScript + esbuild. Scaffold from the official
[`obsidian-sample-plugin`](https://github.com/obsidianmd/obsidian-sample-plugin).

```
manifest.json        # id: "vim-digraphs", name: "Vim Digraphs", minAppVersion ~1.4.0,
                     #   isDesktopOnly: false, description per PROJECT.md
main.ts              # plugin entry: lifecycle, wiring
vim-bridge.ts        # ALL undocumented Obsidian/CM/vim access lives here
digraphs.ts          # Stage 1 hardcoded map (Stage 2: generated full table)
capture.ts           # the Ctrl-K capture state machine
statusbar.ts         # status-bar indicator
esbuild.config.mjs   # bundler (from sample plugin)
package.json / tsconfig.json (strict) / styles.css / versions.json
```

Build: `npm install`, then `npm run dev` (watch) / `npm run build`.

## Testing in Obsidian
1. Build, then make the output (`manifest.json`, `main.js`, `styles.css`) available
   at `<vault>/.obsidian/plugins/vim-digraphs/` — symlink the project dir or copy.
   Use a throwaway **dev vault**, not real notes.
2. Settings → Community plugins → enable **Vim Digraphs**.
3. Settings → Editor → enable **Vim key bindings**.
4. After a rebuild, reload the plugin (toggle off/on, or `Cmd-R` to reload the app)
   to pick up changes — Obsidian does not hot-reload plugin code.
5. Walk the Stage 1 acceptance criteria in `PROJECT.md` §7.

## Architecture / integration facts (researched, verify on contact)
These were confirmed against `esm7/obsidian-vimrc-support` and `replit/codemirror-vim`,
but are undocumented Obsidian internals — guard every access and fail soft.

- **Active editor:** `app.workspace.getActiveViewOfType(MarkdownView)`; the
  Obsidian `Editor` is `view.editor`.
- **CM6 `EditorView`:** `(view as any).editMode?.editor?.cm`.
- **CM5-compat object** (what the vim adapter attaches): `(view as any).editMode?.editor?.cm?.cm`.
  May be `undefined` for non-Markdown views — guard.
- **Vim object (global):** `(window as any).CodeMirrorAdapter?.Vim`.
- **Current vim mode:**
  - Preferred (stateless, query at keypress): read `cm.state.vim.insertMode`
    (boolean) from the CM5-compat object. **Verify this path exists**; if not,
  - Fallback: track mode by listening to the `'vim-mode-change'` event:
    `cm.on('vim-mode-change', (e) => /* e.mode ∈ insert|normal|visual|replace */)`.
    You need this listener anyway to clear the status indicator when the user
    leaves insert mode mid-capture.
- **Inserting the resolved char:** `view.editor.replaceSelection(char)` — idiomatic,
  cursor- and undo-correct. Do **not** dispatch raw key events.
- **Digraphs are NOT implemented** by Obsidian or codemirror-vim — that's why this
  plugin exists. We capture keys ourselves.

## Recommended capture approach
A single global keydown handler in the **capture phase**, registered via
`this.registerDomEvent(document, 'keydown', handler, { capture: true })`. A
module-level state machine (`IDLE → AWAIT1 → AWAIT2`):

1. On every keydown, first resolve the active `MarkdownView`; bail if none, if Vim
   mode is off, or if not in insert mode (per the mode check above).
2. `IDLE`: if the event is `Ctrl-K` (`e.ctrlKey && e.key === 'k'`), `preventDefault()`
   + `stopPropagation()`, go `AWAIT1`, show the indicator. Otherwise ignore.
3. `AWAIT1`: `Esc` cancels; otherwise record `char1 = e.key`, `preventDefault()`,
   go `AWAIT2`, update the indicator.
4. `AWAIT2`: `Esc` cancels; otherwise `char2 = e.key`, `preventDefault()`, look up
   `char1+char2` in the map, insert via `replaceSelection` if found (else cancel
   silently — see `PROJECT.md` §6), reset to `IDLE`, clear the indicator.

Notes:
- Use `e.key` (the produced character) so shifted/symbol keys (`>` = Shift+`.`,
  `<`, `'`) capture correctly. Ignore pure modifier-only keydowns (`Shift`,
  `Control`, etc.) while awaiting — don't consume them as char1/char2.
- Capture phase + `preventDefault`/`stopPropagation` ensures the keys never reach
  CodeMirror/vim and get typed.
- An alternative trigger is a `Prec.highest(keymap.of([{ key: 'Ctrl-k', run }]))`
  CM6 editor extension via `registerEditorExtension`; the DOM capture approach
  above is preferred for Stage 1 because it keeps the whole flow in one place and
  doesn't depend on codemirror-vim passing `Ctrl-K` through. Pick one; don't do both.

## Conventions
- Follow Obsidian community-plugin guidelines: no `innerHTML`/`outerHTML`/`insertAdjacentHTML`
  — build DOM via `createEl`/`createDiv`/`setText`; clean up all listeners (use the
  plugin's `register*` helpers so teardown is automatic); no leftover `console.log`
  noise; `const`/`let`, `async`/`await`.
- `tsconfig` strict mode on.
- Match the surrounding style of whatever scaffold you generate; keep modules small.

## When stuck on Obsidian/CM/vim API
Reference implementations:
- `esm7/obsidian-vimrc-support` (`main.ts`) — how to reach the CM/vim objects and
  the `vim-mode-change` event.
- `replit/codemirror-vim` — the vim implementation Obsidian bundles (`getCM`, `Vim`).
- `obsidianmd/obsidian-sample-plugin` — scaffold, build, lifecycle, status bar.
