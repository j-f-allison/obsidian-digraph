import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

export interface VimDigraphSettings {
  cmdlineDigraphs: boolean;
  bsDigraphs: boolean;
  customDigraphs: Record<string, string>;
}

export const DEFAULT_SETTINGS: VimDigraphSettings = {
  cmdlineDigraphs: false,
  bsDigraphs: false,
  customDigraphs: {},
};

interface SettingsHost {
  settings: VimDigraphSettings;
  saveSettings(): Promise<void>;
}

export class DigraphSettingTab extends PluginSettingTab {
  private readonly host: SettingsHost;

  constructor(app: App, plugin: Plugin & SettingsHost) {
    super(app, plugin);
    this.host = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Ctrl-K in Vim command-line mode')
      .setDesc("Enable digraph entry while Vim's : or / command line is active.")
      .addToggle(t =>
        t.setValue(this.host.settings.cmdlineDigraphs)
          .onChange(async v => {
            this.host.settings.cmdlineDigraphs = v;
            await this.host.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('{char}<BS>{char} digraph entry')
      .setDesc("Type a character, Backspace, then another character to insert a digraph (mirrors Vim's 'digraph' option).")
      .addToggle(t =>
        t.setValue(this.host.settings.bsDigraphs)
          .onChange(async v => {
            this.host.settings.bsDigraphs = v;
            await this.host.saveSettings();
          })
      );

    containerEl.createEl('h3', { text: 'Custom digraphs' });
    containerEl.createEl('p', {
      text: 'Two-character codes mapped to a custom character. Custom entries override built-in ones with the same code.',
      cls: 'setting-item-description',
    });

    const listEl = containerEl.createDiv({ cls: 'vim-digraph-custom-list' });
    this.renderCustomList(listEl);

    const addRow = containerEl.createDiv({ cls: 'vim-digraph-add-row' });
    const codeIn = addRow.createEl('input', {
      type: 'text',
      placeholder: 'Code (2 chars)',
      cls: 'vim-digraph-add-code',
    }) as HTMLInputElement;
    codeIn.maxLength = 2;

    const charIn = addRow.createEl('input', {
      type: 'text',
      placeholder: 'Char',
      cls: 'vim-digraph-add-char',
    }) as HTMLInputElement;
    charIn.maxLength = 2; // surrogate pairs are 2 UTF-16 units

    const addBtn = addRow.createEl('button', { text: 'Add' });
    addBtn.addEventListener('click', async () => {
      const code = codeIn.value;
      const char = charIn.value.trim();
      if (code.length !== 2 || char.length === 0) return;
      this.host.settings.customDigraphs[code] = char;
      await this.host.saveSettings();
      codeIn.value = '';
      charIn.value = '';
      listEl.empty();
      this.renderCustomList(listEl);
    });
  }

  private renderCustomList(listEl: HTMLElement): void {
    const entries = Object.entries(this.host.settings.customDigraphs);
    if (entries.length === 0) {
      listEl.createEl('p', {
        text: 'No custom digraphs defined.',
        cls: 'setting-item-description',
      });
      return;
    }
    entries.sort((a, b) => a[0].localeCompare(b[0])).forEach(([code, char]) => {
      const row = listEl.createDiv({ cls: 'vim-digraph-custom-row' });
      row.createSpan({ text: code, cls: 'vim-digraph-code' });
      row.createSpan({ text: ' → ' });
      row.createSpan({ text: char, cls: 'vim-digraph-char' });
      const delBtn = row.createEl('button', { text: 'Remove' });
      delBtn.addClass('vim-digraph-remove-btn');
      delBtn.addEventListener('click', async () => {
        delete this.host.settings.customDigraphs[code];
        await this.host.saveSettings();
        row.remove();
        if (Object.keys(this.host.settings.customDigraphs).length === 0) {
          listEl.empty();
          this.renderCustomList(listEl);
        }
      });
    });
  }
}
