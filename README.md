# Vim Digraphs

Reproduces Vim/Neovim's [digraph](https://vimhelp.org/digraph.txt.html) feature
inside Obsidian's built-in Vim mode. While Vim mode is on and the editor is in
**insert mode**, press <kbd>Ctrl</kbd>+<kbd>K</kbd> followed by a two-character
mnemonic to insert the corresponding Unicode character at the cursor — exactly as
in `nvim`.

```
Ctrl-K e '   →  é
Ctrl-K e !   →  è
Ctrl-K - >   →  →
Ctrl-K < -   →  ←
```

The full RFC-1345 Vim digraph table is included (1276 entries), generated directly
from Vim's `digraph.txt`.

## Requirements

- Obsidian 1.4.0 or later.
- **Vim key bindings enabled** (Settings → Editor → Vim key bindings). The plugin
  is inert when Vim mode is off.

## Usage

1. Enter insert mode (`i`, `a`, etc.).
2. Press <kbd>Ctrl</kbd>+<kbd>K</kbd>. A `^K` indicator appears in the status bar
   and a greyed-out `?` hint appears at the cursor.
3. Type the two-character digraph code. The resolved character is inserted; the
   code keystrokes themselves are not typed into the document.

- <kbd>Esc</kbd> during entry cancels — nothing is inserted.
- An unknown code inserts nothing and clears the indicator.

### Browse the table

Run **Show digraph table** from the command palette to open a searchable list of
every digraph (code, character, codepoint). With command-line digraphs enabled,
`:digraphs` works as a Vim Ex command too.

> **Note on tildes:** Vim's table uses `?` as the combining-tilde marker, so `ñ`
> is `n?`, `ã` is `a?`, and so on — not `n~`.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Ctrl-K in Vim command-line mode | off | Allow digraph entry while Vim's `:` or `/` command line is active. |
| `{char}<BS>{char}` entry | off | Type a character, Backspace, then another to insert a digraph (mirrors Vim's `'digraph'` option). |
| Custom digraphs | — | Define your own two-character codes. Custom entries override built-in ones with the same code. |

## Limitations

- Insert mode (and optionally command-line mode); no normal/visual-mode entry.
- Requires a keyboard with <kbd>Ctrl</kbd>+<kbd>K</kbd>. On mobile this means a
  hardware keyboard; without one there is no way to trigger it.
- Codes are matched in exact order only.

## Development

```bash
npm install
npm run dev      # watch build
npm run build    # type-check + production build
npm run gen      # regenerate digraphs.ts from Vim's digraph.txt
```

`vim-bridge.ts` isolates all undocumented Obsidian/CodeMirror/vim internals so
version breakage stays contained.

## License

[MIT](LICENSE)
