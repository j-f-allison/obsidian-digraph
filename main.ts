import { Plugin } from 'obsidian';
import { DigraphCapture } from './capture';
import { DigraphStatusBar } from './statusbar';

export default class VimDigraphsPlugin extends Plugin {
  async onload(): Promise<void> {
    const statusBar = new DigraphStatusBar(this.addStatusBarItem());
    const capture = new DigraphCapture(this.app, statusBar);

    this.registerDomEvent(
      document,
      'keydown',
      (e: KeyboardEvent) => capture.handleKeydown(e),
      { capture: true },
    );
  }
}
