import { Extension, StateEffect, StateField } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, WidgetType } from '@codemirror/view';

class QuestionWidget extends WidgetType {
  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'vim-digraph-cursor-hint';
    span.textContent = '?';
    return span;
  }
  eq(): boolean { return true; }
  ignoreEvent(): boolean { return true; }
}

const setActive = StateEffect.define<boolean>();

const hintField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    for (const e of tr.effects) {
      if (e.is(setActive)) {
        if (!e.value) return Decoration.none;
        const pos = tr.state.selection.main.head;
        return Decoration.set([
          Decoration.widget({ widget: new QuestionWidget(), side: 1 }).range(pos),
        ]);
      }
    }
    // Clear if the document changed (cursor moved via mouse, etc.) — capture.ts
    // will handle the state machine reset via mode checks on the next keydown.
    if (tr.docChanged || tr.selection) return Decoration.none;
    return deco.map(tr.changes);
  },
  provide: f => EditorView.decorations.from(f),
});

export const digraphCursorExtension: Extension = hintField;

export function setDigraphHint(cm6: EditorView, active: boolean): void {
  cm6.dispatch({ effects: setActive.of(active) });
}
