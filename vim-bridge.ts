// All undocumented Obsidian/CodeMirror/vim internals live here.
// These paths are confirmed via obsidian-vimrc-support but are version-sensitive —
// every access is guarded so breakage is contained to this module.
import { EditorView } from '@codemirror/view';
import { MarkdownView } from 'obsidian';

function getCm5(view: MarkdownView): any {
  return (view as any).editMode?.editor?.cm?.cm;
}

export function getCm6(view: MarkdownView): EditorView | undefined {
  return (view as any).editMode?.editor?.cm ?? undefined;
}

export function isInInsertMode(view: MarkdownView): boolean {
  return getCm5(view)?.state?.vim?.insertMode === true;
}

// Registers a callback for vim mode changes on the given view's CM5 object.
// Returns an unregister function, or null if the CM5 object is unavailable.
export function onVimModeChange(
  view: MarkdownView,
  cb: (mode: string) => void,
): (() => void) | null {
  const cm5 = getCm5(view);
  if (!cm5) return null;
  const handler = (e: any) => cb(e.mode as string);
  cm5.on('vim-mode-change', handler);
  return () => cm5.off('vim-mode-change', handler);
}

// Registers a Vim Ex command (e.g. :digraphs). Best-effort: silently skips if
// the global Vim adapter is unavailable.
export function defineVimExCommand(name: string, callback: () => void): void {
  const Vim = (window as any).CodeMirrorAdapter?.Vim;
  Vim?.defineEx?.(name, '', () => callback());
}

// Returns true when Vim's command-line input (for : / ? commands) is focused.
// Relies on the CM6 vim panel DOM structure — best-effort.
export function isVimCommandLineActive(): boolean {
  const el = document.activeElement;
  if (!(el instanceof HTMLInputElement)) return false;
  return el.closest('.cm-vim-panel') !== null;
}

// Inserts text at the cursor position in the focused command-line input.
export function insertIntoCommandLine(char: string): void {
  const el = document.activeElement;
  if (!(el instanceof HTMLInputElement)) return;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? start;
  el.value = el.value.slice(0, start) + char + el.value.slice(end);
  el.setSelectionRange(start + char.length, start + char.length);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
