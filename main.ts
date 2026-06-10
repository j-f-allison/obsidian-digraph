import { Plugin } from 'obsidian';
import { DigraphCapture } from './capture';
import { digraphCursorExtension } from './cursor-hint';
import { DigraphsModal } from './digraphs-modal';
import { DEFAULT_SETTINGS, DigraphSettingTab, VimDigraphSettings } from './settings';
import { DigraphStatusBar } from './statusbar';
import { defineVimExCommand } from './vim-bridge';

export default class VimDigraphsPlugin extends Plugin {
  settings!: VimDigraphSettings;

  async onload(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    this.addSettingTab(new DigraphSettingTab(this.app, this));

    const statusBar = new DigraphStatusBar(this.addStatusBarItem());
    const capture = new DigraphCapture(this.app, statusBar, this.settings);

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

    this.app.workspace.onLayoutReady(() => {
      defineVimExCommand('digraphs', () => new DigraphsModal(this.app).open());
    });
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
