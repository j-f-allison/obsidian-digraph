export class DigraphStatusBar {
  private el: HTMLElement;

  constructor(el: HTMLElement) {
    this.el = el;
    this.el.hide();
  }

  show(text: string): void {
    this.el.setText(text);
    this.el.show();
  }

  hide(): void {
    this.el.hide();
  }
}
