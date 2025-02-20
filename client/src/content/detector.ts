import { debounce } from "lodash.debounce";

// Input field selectors
const INPUT_SELECTORS = [
  "textarea",
  'input[type="text"]',
  'div[contenteditable="true"]',
  '[role="textbox"]',
];

export interface InputChangeEvent {
  element: HTMLElement;
  value: string;
  cursorPosition: number;
}

export class InputDetector {
  private static instance: InputDetector;
  private observer: MutationObserver;
  private activeElement: HTMLElement | null = null;
  private onInputChange?: (event: InputChangeEvent) => void;

  private constructor() {
    this.observer = new MutationObserver(this.handleDOMMutation.bind(this));
  }

  static getInstance(): InputDetector {
    if (!this.instance) {
      this.instance = new InputDetector();
    }
    return this.instance;
  }

  initialize(callback: (event: InputChangeEvent) => void) {
    this.onInputChange = callback;
    this.startObserving();
    this.attachEventListeners();
  }

  private startObserving() {
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  private attachEventListeners() {
    document.addEventListener("focus", this.handleFocus.bind(this), true);
    document.addEventListener("input", this.handleInput.bind(this), true);
    document.addEventListener("blur", this.handleBlur.bind(this), true);
  }

  private handleDOMMutation = debounce(() => {
    const activeEl = document.activeElement as HTMLElement;
    if (this.isValidInput(activeEl)) {
      this.setActiveElement(activeEl);
    }
  }, 100);

  private handleFocus(event: FocusEvent) {
    const target = event.target as HTMLElement;
    if (this.isValidInput(target)) {
      this.setActiveElement(target);
    }
  }

  private handleInput = debounce((event: Event) => {
    const target = event.target as HTMLElement;
    if (this.isValidInput(target)) {
      this.notifyInputChange(target);
    }
  }, 300);

  private handleBlur() {
    this.activeElement = null;
  }

  private isValidInput(element: HTMLElement | null): boolean {
    return (
      element !== null &&
      INPUT_SELECTORS.some((selector) => element.matches(selector))
    );
  }

  private setActiveElement(element: HTMLElement) {
    if (this.activeElement !== element) {
      this.activeElement = element;
      this.notifyInputChange(element);
    }
  }

  private notifyInputChange(element: HTMLElement) {
    if (!this.onInputChange) return;

    const value = this.getElementValue(element);
    const cursorPosition = this.getCursorPosition(element);

    this.onInputChange({
      element,
      value,
      cursorPosition,
    });
  }

  private getElementValue(element: HTMLElement): string {
    if ("value" in element) {
      return (element as HTMLInputElement).value;
    }
    return element.textContent || "";
  }

  private getCursorPosition(element: HTMLElement): number {
    if ("selectionStart" in element) {
      return (element as HTMLInputElement).selectionStart || 0;
    }
    const selection = window.getSelection();
    return selection?.focusOffset || 0;
  }

  cleanup() {
    this.observer.disconnect();
    document.removeEventListener("focus", this.handleFocus.bind(this), true);
    document.removeEventListener("input", this.handleInput.bind(this), true);
    document.removeEventListener("blur", this.handleBlur.bind(this), true);
  }
}
