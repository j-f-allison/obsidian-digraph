import { Plugin } from 'obsidian';
import { DigraphCapture } from './capture';
import { digraphCursorExtension } from './cursor-hint';
import { DigraphsModal } from './digraphs-modal';
import { DigraphStatusBar } from './statusbar';
import { defineVimExCommand } from './vim-bridge';

export default class VimDigraphsPlugin extends Plugin {
  async onload(): Promise<void> {
    const statusBar = new DigraphStatusBar(this.addStatusBarItem());
    const capture = new DigraphCapture(this.app, statusBar);

    this.registerEditorExtension([digraphCursorExtension]);

    this.registerDomEvent(
      document,
      'keydown',
      (e: KeyboardEvent) => capture.handleKeydown(e),
      { capture: true },
    );

    this.addCommand({
      id: 'show-digraph-table',
      name: 'Show digraph table',
      callback: () => new DigraphsModal(this.app).open(),
    });

    // Also wire :digraphs as a Vim Ex command. The Vim adapter may not be
    // initialized yet at plugin load, so we defer until the workspace is ready.
    this.app.workspace.onLayoutReady(() => {
      defineVimExCommand('digraphs', () => new DigraphsModal(this.app).open());
    });
  }
}
