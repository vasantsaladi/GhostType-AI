// Define types for Chrome's AI API
interface ChromeAI {
  languageModel: {
    createTextSession(): Promise<TextSession>;
  };
}

interface TextSession {
  prompt(text: string): Promise<TextCompletion>;
}

interface TextCompletion {
  text: () => Promise<string>;
}

// Extend Window interface to include AI property
declare global {
  interface Window {
    ai?: ChromeAI;
  }
}

// Define the CompletionContext type
interface CompletionContext {
  currentInput: string;
  history: string[];
}

export class GeminiNano {
  private static instance: GeminiNano;
  private session: TextSession | null = null;

  private constructor() {}

  static async initialize(): Promise<GeminiNano> {
    if (!this.instance) {
      this.instance = new GeminiNano();
      await this.instance.initializeSession();
    }
    return this.instance;
  }

  private async initializeSession(): Promise<void> {
    if (!window.ai?.languageModel) {
      throw new Error(
        "Chrome AI API not available. Please enable required flags and ensure Chrome version supports AI API."
      );
    }
    this.session = await window.ai.languageModel.createTextSession();
  }

  async generateCompletion(context: CompletionContext): Promise<string> {
    if (!this.session) {
      await this.initializeSession();
    }

    try {
      const prompt = `Complete this text: ${
        context.currentInput
      }\n\nContext:\n${context.history.join("\n")}`;
      const completion = await this.session!.prompt(prompt);
      return await completion.text();
    } catch (error) {
      console.error("Error generating completion:", error);
      return "";
    }
  }
}
