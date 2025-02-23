import { generatePrediction } from "./openai";
import { isSensitiveField } from "../utils/security";
import debounce from "lodash/debounce";

export class GhostTextManager {
  private ghostElement: HTMLDivElement | null = null;
  private currentInput: Element | null = null;
  private cache = new Map<string, string>();
  private isTabPressed = false;

  constructor() {
    this.initializeGhostElement();
  }

  private initializeGhostElement() {
    this.ghostElement = document.createElement("div");
    this.ghostElement.className = "ghost-text";
    this.ghostElement.style.cssText = `
      position: absolute;
      pointer-events: none;
      color: #666;
      opacity: 0.5;
      font-family: inherit;
      font-size: inherit;
      padding: inherit;
      white-space: pre-wrap;
      z-index: 999999;
      display: none;
      background: transparent;
    `;
    document.body.appendChild(this.ghostElement);
  }

  public attachInputHandler(element: Element) {
    if (element instanceof HTMLElement && isSensitiveField(element)) {
      return; // Don't attach to sensitive fields
    }

    // Remove existing listeners if any
    element.removeEventListener("input", this.handleInput);
    element.removeEventListener("blur", this.hideGhostText);
    element.removeEventListener("keydown", this.handleKeyDown);
    element.removeEventListener("keyup", this.handleKeyUp);
    element.removeEventListener("focus", this.handleFocus);

    // Add listeners
    element.addEventListener("input", this.handleInput);
    element.addEventListener("blur", this.hideGhostText);
    element.addEventListener("keydown", this.handleKeyDown);
    element.addEventListener("keyup", this.handleKeyUp);
    element.addEventListener("focus", this.handleFocus);
  }

  private handleFocus = (event: FocusEvent) => {
    const input = event.target as HTMLElement;
    this.currentInput = input;
    const text = this.getInputText(input);
    if (text.length >= 5) {
      this.handleInput(event);
    }
  };

  private handleInput = debounce(async (event: Event) => {
    const input = event.target as HTMLElement;
    if (!input || !this.ghostElement) return;

    const text = this.getInputText(input);
    if (text.length < 5) {
      this.hideGhostText();
      return;
    }

    try {
      const prediction = await this.getPrediction(text);
      if (prediction && prediction !== text) {
        this.showGhostText(prediction, input);
      }
    } catch (error) {
      console.error("Error getting prediction:", error);
      this.hideGhostText();
    }
  }, 300);

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Tab" && !event.shiftKey) {
      if (this.ghostElement?.style.display !== "none") {
        event.preventDefault();
        event.stopPropagation();
        this.isTabPressed = true;
        this.applyPrediction();
      }
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    if (event.key === "Tab") {
      this.isTabPressed = false;
    }
  };

  private getInputText(element: HTMLElement): string {
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      return element.value;
    } else if (element.getAttribute("contenteditable") === "true") {
      return element.textContent || "";
    } else {
      // Try to find the nearest contenteditable parent
      const editableParent = element.closest('[contenteditable="true"]');
      if (editableParent) {
        return editableParent.textContent || "";
      }
    }
    return element.textContent || "";
  }

  private async getPrediction(text: string): Promise<string> {
    const cacheKey = text.toLowerCase();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const prediction = await generatePrediction(text);
    if (prediction) {
      this.cache.set(cacheKey, prediction);
    }
    return prediction;
  }

  private showGhostText(prediction: string, input: HTMLElement) {
    if (!this.ghostElement) return;

    const rect = input.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(input);

    // Position the ghost text
    this.ghostElement.style.left = `${rect.left + window.scrollX}px`;
    this.ghostElement.style.top = `${rect.top + window.scrollY}px`;
    this.ghostElement.style.width = computedStyle.width;
    this.ghostElement.style.height = computedStyle.height;
    this.ghostElement.style.fontFamily = computedStyle.fontFamily;
    this.ghostElement.style.fontSize = computedStyle.fontSize;
    this.ghostElement.style.lineHeight = computedStyle.lineHeight;
    this.ghostElement.style.padding = computedStyle.padding;
    this.ghostElement.style.margin = computedStyle.margin;
    this.ghostElement.style.border = "none";

    this.ghostElement.textContent = prediction;
    this.ghostElement.style.display = "block";
    this.currentInput = input;
  }

  private hideGhostText = () => {
    if (this.ghostElement) {
      this.ghostElement.style.display = "none";
    }
  };

  private applyPrediction() {
    if (
      !this.ghostElement ||
      !this.currentInput ||
      this.ghostElement.style.display === "none"
    )
      return;

    const prediction = this.ghostElement.textContent;
    if (!prediction) return;

    try {
      if (
        this.currentInput instanceof HTMLInputElement ||
        this.currentInput instanceof HTMLTextAreaElement
      ) {
        // For standard input elements
        this.currentInput.value = prediction;
        this.currentInput.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        // For contenteditable elements
        const editableElement =
          this.currentInput.getAttribute("contenteditable") === "true"
            ? this.currentInput
            : this.currentInput.closest('[contenteditable="true"]');

        if (editableElement) {
          editableElement.textContent = prediction;
          editableElement.dispatchEvent(
            new InputEvent("input", { bubbles: true })
          );
        }
      }

      // Create and dispatch a custom event for platforms that might need it
      const customEvent = new CustomEvent("textUpdate", {
        detail: { text: prediction },
        bubbles: true,
      });
      this.currentInput.dispatchEvent(customEvent);
    } catch (error) {
      console.error("Error applying prediction:", error);
    }

    this.hideGhostText();
  }
}
