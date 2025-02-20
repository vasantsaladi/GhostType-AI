export interface CompletionContext {
  currentInput: string;
  previousInputs: string[];
  cursorPosition: number;
}

export class ContextManager {
  private static instance: ContextManager;
  private previousInputs: string[] = [];
  private maxContextSize = 5;
  private maxInputLength = 1000;

  private constructor() {}

  static getInstance(): ContextManager {
    if (!this.instance) {
      this.instance = new ContextManager();
    }
    return this.instance;
  }

  addInput(input: string) {
    // Trim input if it exceeds max length
    const trimmedInput = input.slice(0, this.maxInputLength);

    // Add to history, maintaining max size
    this.previousInputs.push(trimmedInput);
    if (this.previousInputs.length > this.maxContextSize) {
      this.previousInputs.shift();
    }
  }

  getContext(currentInput: string, cursorPosition: number): CompletionContext {
    return {
      currentInput,
      previousInputs: [...this.previousInputs],
      cursorPosition,
    };
  }

  clear() {
    this.previousInputs = [];
  }

  setMaxContextSize(size: number) {
    this.maxContextSize = size;
    // Trim history if needed
    while (this.previousInputs.length > size) {
      this.previousInputs.shift();
    }
  }

  setMaxInputLength(length: number) {
    this.maxInputLength = length;
    // Trim existing inputs if needed
    this.previousInputs = this.previousInputs.map((input) =>
      input.slice(0, length)
    );
  }
}
