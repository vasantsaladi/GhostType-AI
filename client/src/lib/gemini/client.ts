import { CompletionContext } from "./context";

interface TextSession {
  prompt(text: string): Promise<TextCompletion>;
}

interface TextCompletion {
  text: () => Promise<string>;
}

declare global {
  interface Window {
    ai?: {
      languageModel: {
        createTextSession(): Promise<TextSession>;
      };
    };
  }
}

export class GeminiClient {
  private static instance: GeminiClient;
  private session: TextSession | null = null;
  private isInitializing = false;

  private constructor() {}

  static getInstance(): GeminiClient {
    if (!this.instance) {
      this.instance = new GeminiClient();
    }
    return this.instance;
  }

  async initialize(): Promise<void> {
    if (this.session || this.isInitializing) return;

    this.isInitializing = true;
    try {
      if (!window.ai?.languageModel) {
        throw new Error("Chrome AI API not available");
      }
      this.session = await window.ai.languageModel.createTextSession();
    } catch (error) {
      console.error("Failed to initialize Gemini client:", error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  async generateCompletion(context: CompletionContext): Promise<string> {
    if (!this.session) {
      await this.initialize();
    }

    try {
      const prompt = this.buildPrompt(context);
      const completion = await this.session!.prompt(prompt);
      return await completion.text();
    } catch (error) {
      console.error("Error generating completion:", error);
      return "";
    }
  }

  private buildPrompt(context: CompletionContext): string {
    const { currentInput, previousInputs, cursorPosition } = context;

    // Build context from previous inputs
    const contextString = previousInputs
      .slice(-5) // Keep last 5 inputs for context
      .join("\n");

    // Get text before cursor for current input
    const currentContext = currentInput.substring(0, cursorPosition);

    return `
Previous context:
${contextString}

Current text:
${currentContext}

Complete the current text:`;
  }
}
