import { App, Modal } from 'obsidian';
import { DIGRAPHS } from './digraphs';

// Sorted once at module load: [code, char, codepoint]
const TABLE: [string, string, number][] = Object.entries(DIGRAPHS)
  .map(([code, char]): [string, string, number] => [
    code,
    char,
    char.codePointAt(0) ?? 0,
  ])
  .sort((a, b) => a[2] - b[2]);

function toHex(cp: number): string {
  return 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');
}

export class DigraphsModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.addClass('vim-digraph-modal');

    contentEl.createEl('h2', { text: 'Vim Digraph Table' });

    const search = contentEl.createEl('input', {
      type: 'text',
      placeholder: 'Filter by code or character…',
      cls: 'vim-digraph-search',
    });
    search.focus();

    const tableWrap = contentEl.createDiv({ cls: 'vim-digraph-table-wrap' });
    const table = tableWrap.createEl('table', { cls: 'vim-digraph-table' });
    const thead = table.createEl('thead');
    const headerRow = thead.createEl('tr');
    headerRow.createEl('th', { text: 'Code' });
    headerRow.createEl('th', { text: 'Char' });
    headerRow.createEl('th', { text: 'Codepoint' });
    const tbody = table.createEl('tbody');

    const rows: HTMLTableRowElement[] = TABLE.map(([code, char, cp]) => {
      const tr = tbody.createEl('tr');
      tr.createEl('td', { text: code, cls: 'vim-digraph-code' });
      tr.createEl('td', { text: char, cls: 'vim-digraph-char' });
      tr.createEl('td', { text: toHex(cp), cls: 'vim-digraph-cp' });
      return tr;
    });

    search.addEventListener('input', () => {
      const q = search.value.toLowerCase();
      rows.forEach((tr, i) => {
        const [code, char] = TABLE[i];
        const match = !q || code.toLowerCase().includes(q) || char === q;
        tr.style.display = match ? '' : 'none';
      });
    });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
