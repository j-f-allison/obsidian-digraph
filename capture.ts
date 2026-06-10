import { App, MarkdownView } from 'obsidian';
import { DIGRAPHS } from './digraphs';
import { setDigraphHint } from './cursor-hint';
import { DigraphStatusBar } from './statusbar';
import { getCm6, isInInsertMode, onVimModeChange } from './vim-bridge';

type State = 'IDLE' | 'AWAIT1' | 'AWAIT2';

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta']);

export class DigraphCapture {
  private state: State = 'IDLE';
  private char1 = '';
  private modeChangeOff: (() => void) | null = null;

  constructor(
    private readonly app: App,
    private readonly statusBar: DigraphStatusBar,
  ) {}

  handleKeydown(e: KeyboardEvent): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (this.state !== 'IDLE') {
      // Cancel if focus moved away or vim mode is no longer in insert mode.
      if (!view || !isInInsertMode(view)) {
        this.reset();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.reset();
        return;
      }

      if (MODIFIER_KEYS.has(e.key)) return;

      e.preventDefault();
      e.stopPropagation();

      if (this.state === 'AWAIT1') {
        this.char1 = e.key;
        this.state = 'AWAIT2';
        this.statusBar.show(`^K ${this.char1}`);
        return;
      }

      // AWAIT2: resolve and insert.
      const result = DIGRAPHS[this.char1 + e.key];
      if (result !== undefined) {
        view.editor.replaceSelection(result);
      }
      this.reset();
      return;
    }

    // IDLE: only act on Ctrl-K while in insert mode.
    if (!view || !isInInsertMode(view)) return;
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      e.stopPropagation();
      this.state = 'AWAIT1';
      this.statusBar.show('^K');
      const cm6 = getCm6(view);
      if (cm6) setDigraphHint(cm6, true);
      this.modeChangeOff = onVimModeChange(view, (mode) => {
        if (mode !== 'insert') this.reset();
      });
    }
  }

  private reset(): void {
    this.state = 'IDLE';
    this.char1 = '';
    this.modeChangeOff?.();
    this.modeChangeOff = null;
    this.statusBar.hide();
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      const cm6 = getCm6(view);
      if (cm6) setDigraphHint(cm6, false);
    }
  }
}
