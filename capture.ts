import { App, MarkdownView } from 'obsidian';
import { DIGRAPHS } from './digraphs';
import { setDigraphHint } from './cursor-hint';
import { VimDigraphSettings } from './settings';
import { DigraphStatusBar } from './statusbar';
import {
  getCm6,
  insertIntoCommandLine,
  isInInsertMode,
  isVimCommandLineActive,
  onVimModeChange,
} from './vim-bridge';

type State = 'IDLE' | 'AWAIT1' | 'AWAIT2' | 'BS_AWAIT2';
type CaptureMode = 'editor' | 'cmdline';

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta']);

export class DigraphCapture {
  private state: State = 'IDLE';
  private char1 = '';
  private captureMode: CaptureMode = 'editor';
  private lastTypedChar = '';
  private modeChangeOff: (() => void) | null = null;

  constructor(
    private readonly app: App,
    private readonly statusBar: DigraphStatusBar,
    private readonly settings: VimDigraphSettings,
  ) {}

  handleKeydown(e: KeyboardEvent): void {
    if (this.state !== 'IDLE') {
      this.handleCapturing(e);
      return;
    }
    this.handleIdle(e);
  }

  private handleCapturing(e: KeyboardEvent): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (this.captureMode === 'editor') {
      if (!view || !isInInsertMode(view)) { this.reset(view); return; }
    } else {
      if (!isVimCommandLineActive()) { this.reset(view); return; }
    }

    if (MODIFIER_KEYS.has(e.key)) return;

    if (e.key === 'Escape') {
      if (this.state === 'BS_AWAIT2') {
        // The Backspace was consumed to enter this state; perform it now,
        // then let Escape through so Vim exits insert mode normally.
        if (view) this.performBackspace(view);
        this.reset(view);
      } else {
        e.preventDefault();
        e.stopPropagation();
        this.reset(view);
      }
      return;
    }

    if (this.state === 'AWAIT1') {
      e.preventDefault();
      e.stopPropagation();
      this.char1 = e.key;
      this.state = 'AWAIT2';
      this.statusBar.show(`^K ${this.char1}`);
      return;
    }

    if (this.state === 'AWAIT2') {
      e.preventDefault();
      e.stopPropagation();
      const result = this.lookup(this.char1 + e.key);
      if (result !== undefined) this.insert(result, view);
      this.reset(view);
      return;
    }

    if (this.state === 'BS_AWAIT2') {
      // Only printable single-character keys are valid as char2
      if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) {
        // Non-printable: perform the deferred backspace, let the key through
        if (view) this.performBackspace(view);
        this.reset(view);
        return;
      }
      const result = this.lookup(this.char1 + e.key);
      if (result !== undefined) {
        e.preventDefault();
        e.stopPropagation();
        if (view) this.performBackspace(view);
        this.insert(result, view);
      } else {
        // Unknown digraph: execute the backspace and let char2 type naturally
        if (view) this.performBackspace(view);
        // no preventDefault — char2 types normally
      }
      this.reset(view);
      return;
    }
  }

  private handleIdle(e: KeyboardEvent): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);

    // {char}<BS>{char} digraph entry (mirrors Vim's 'digraph' option)
    if (
      this.settings.bsDigraphs &&
      view && isInInsertMode(view) &&
      e.key === 'Backspace' &&
      !e.ctrlKey && !e.altKey && !e.metaKey &&
      this.lastTypedChar
    ) {
      const cursor = view.editor.getCursor();
      const line = view.editor.getLine(cursor.line);
      // Sanity check: the char before the cursor must still be lastTypedChar
      if (cursor.ch > 0 && line[cursor.ch - 1] === this.lastTypedChar) {
        e.preventDefault();
        e.stopPropagation();
        this.char1 = this.lastTypedChar;
        this.lastTypedChar = '';
        this.captureMode = 'editor';
        this.state = 'BS_AWAIT2';
        this.statusBar.show(`^K ${this.char1}`);
        const cm6 = getCm6(view);
        if (cm6) setDigraphHint(cm6, true);
        return;
      }
    }

    // Ctrl-K digraph entry
    if (e.ctrlKey && e.key === 'k') {
      const inInsert = view && isInInsertMode(view);
      const inCmdLine = this.settings.cmdlineDigraphs && isVimCommandLineActive();
      if (!inInsert && !inCmdLine) return;

      e.preventDefault();
      e.stopPropagation();
      this.captureMode = inCmdLine ? 'cmdline' : 'editor';
      this.state = 'AWAIT1';
      this.statusBar.show('^K');
      this.lastTypedChar = '';

      if (this.captureMode === 'editor' && view) {
        const capturedView = view;
        const cm6 = getCm6(capturedView);
        if (cm6) setDigraphHint(cm6, true);
        this.modeChangeOff = onVimModeChange(capturedView, (mode) => {
          if (mode !== 'insert') this.reset(capturedView);
        });
      }
      return;
    }

    // Track last typed character for BS digraph feature
    if (this.settings.bsDigraphs && view && isInInsertMode(view)) {
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        this.lastTypedChar = e.key;
      } else if (!MODIFIER_KEYS.has(e.key) && e.key !== 'Backspace') {
        // Cursor movement or other structural key — cursor position may shift
        this.lastTypedChar = '';
      }
    }
  }

  private insert(char: string, view: MarkdownView | null): void {
    if (this.captureMode === 'cmdline') {
      insertIntoCommandLine(char);
    } else {
      view?.editor.replaceSelection(char);
    }
  }

  private reset(view: MarkdownView | null = null): void {
    this.state = 'IDLE';
    this.char1 = '';
    this.captureMode = 'editor';
    this.modeChangeOff?.();
    this.modeChangeOff = null;
    this.statusBar.hide();
    const activeView = view ?? this.app.workspace.getActiveViewOfType(MarkdownView);
    const cm6 = activeView ? getCm6(activeView) : undefined;
    if (cm6) setDigraphHint(cm6, false);
  }

  private lookup(code: string): string | undefined {
    return this.settings.customDigraphs[code] ?? DIGRAPHS[code];
  }

  private performBackspace(view: MarkdownView): void {
    const cursor = view.editor.getCursor();
    if (cursor.ch > 0) {
      view.editor.replaceRange(
        '',
        { line: cursor.line, ch: cursor.ch - 1 },
        cursor,
      );
    }
  }
}
