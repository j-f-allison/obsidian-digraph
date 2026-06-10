# Vim Digraphs — Project Spec

An Obsidian plugin that mirrors Vim/Neovim's **digraph** feature. When Obsidian's
Vim mode is enabled and the editor is in **insert mode**, pressing `Ctrl-K`
followed by a two-character mnemonic inserts the corresponding Unicode character
at the cursor — exactly as in `nvim` (`<C-k>e'` → `é`, `<C-k>->` → `→`).

> Status: **planning complete, awaiting implementation.** This file is the source
> of truth for scope and decisions. See `CLAUDE.md` for the implementer's guide
> and `LOG.md` for the running history.

---

## 1. Goal / vision

A faithful, lightweight reproduction of `nvim`'s digraph entry inside Obsidian's
built-in Vim mode. The end state supports the **full** Vim digraph table (several
hundred entries, RFC-1345-based). We get there in stages; the MVP proves the
end-to-end capture + insert pipeline with a handful of digraphs.

## 2. Background: how Vim digraphs work

- In Vim/Neovim, digraphs are entered in **insert mode** and **command-line
  mode** via `CTRL-K {char1}{char2}`. (There is a secondary `{char1}<BS>{char2}`
  method, active only when the `'digraph'` option is set — out of scope for now.)
- Every digraph code is **exactly two input characters** and produces (almost
  always) **one** output character. The codes come from the RFC-1345 mnemonics
  with Vim additions. Reference: <https://vimhelp.org/digraph.txt.html>.
- Confirmed example codes (verified against Vim's table):
  | Code | Output | Name |
  |------|--------|------|
  | `e'` | `é` (U+00E9) | e with acute |
  | `e!` | `è` (U+00E8) | e with grave |
  | `->` | `→` (U+2192) | rightwards arrow |
  | `<-` | `←` (U+2190) | leftwards arrow |

> **Clarification for the implementer:** the requester described the MVP as
> "single-character digraphs (é)" vs "multi-character digraphs (`->`/`<-`)".
> Mechanically there is **no such distinction** — all Vim digraphs are 2-char
> codes producing 1 output char, and `é`, `→`, `←` are each a single codepoint.
> The real value of covering both kinds of code in the MVP is that they exercise
> the capture path for **letter keys** (`e`, `'`) *and* **symbol/shifted keys**
> (`-`, `>`, `<`), which is where input-handling bugs hide. Treat that as the
> intent.

## 3. Confirmed design decisions

| Decision | Choice | Notes |
|----------|--------|-------|
| Trigger key | `Ctrl-K` | Matches Vim. `Cmd-K` (Obsidian "insert link" on macOS) is untouched. |
| Mode | **Insert mode only** | Faithful to Vim. Normal mode passes `Ctrl-K` through unchanged. Command-line mode (`/`, `:`) deferred to a later stage. |
| Feedback | **Status-bar indicator** | While capturing, show a small status-bar hint (e.g. `^K`, then `^Ke`, then resolve). Cleared on completion, cancel, or leaving insert mode. |
| Insertion | At cursor, via the Obsidian `Editor` API | The captured keystrokes must **not** also be typed into the buffer. |
| Distribution | Build to community-plugin standards | Even if initially personal-use; keeps the door open and enforces good hygiene. |

## 4. Scope / staged roadmap

### Stage 1 — MVP (current target)
Prove the full pipeline with a tiny hardcoded digraph map.

- Hardcoded map: `e'`→`é`, `->`→`→`, `<-`→`←` (required). `e!`→`è` (nice-to-have, free second letter-based case).
- `Ctrl-K` in insert mode (vim on) starts capture; next two chars resolve and insert.
- Status-bar indicator reflects capture progress.
- `Esc` during capture cancels (nothing inserted).
- Unknown two-char code → **cancel silently, insert nothing** (see §6).
- No effect outside insert mode; no effect when Vim mode is off.

### Stage 2 — Full digraph table
- Embed the complete Vim digraph table (generated from `digraph.txt` / `:digraphs`
  output by a separate build/generation script, not hand-typed).
- Decide and implement fidelity details deferred from Stage 1 (see §6).

### Stage 3 — Fidelity & ergonomics (later)
- Command-line mode (`/`, `:`) digraph entry.
- Secondary `{char1}<BS>{char2}` entry (the `'digraph'` option).
- Settings tab: toggle features, view/search the table (`:digraphs`-style), define
  custom digraphs.

## 5. Non-goals (for now)
- Normal-mode or visual-mode digraph entry.
- Replicating Vim's exact on-cursor `?` placeholder rendering during entry (we use
  a status-bar indicator instead).
- Non-Vim-mode behavior. The plugin is inert unless Obsidian Vim mode is on.
- Mobile-specific UX (no physical `Ctrl` key); should not error there, but not a target.

## 6. Open decisions (default now, revisit in Stage 2)
- **Unknown digraph behavior.** Default: cancel, insert nothing. (Real Vim's
  behavior for an unknown pair is subtle; revisit for fidelity in Stage 2.)
- **Reverse-order codes.** Some Vim versions accept the two characters in either
  order. Default Stage 1: exact order only. Verify and decide in Stage 2.
- **Digit-argument / count prefixes** and other `<C-k>` edge cases: out of scope
  until the full table lands.

## 7. Stage 1 acceptance criteria
With Vim mode enabled, in a Markdown editor, in **insert** mode:
1. `Ctrl-K` `e` `'` inserts `é` at the cursor; the literal `e` and `'` are **not** inserted.
2. `Ctrl-K` `-` `>` inserts `→`.
3. `Ctrl-K` `<` `-` inserts `←`.
4. `Ctrl-K` in **normal** mode does nothing special (no capture, no error).
5. `Esc` while waiting for char 1 or char 2 cancels; nothing is inserted; indicator clears.
6. `Ctrl-K` `z` `z` (unknown) inserts nothing and clears the indicator.
7. The status-bar indicator appears during capture and clears afterward.
8. Normal typing and other `Ctrl-*` shortcuts are unaffected; toggling Vim mode
   off disables the feature entirely.
