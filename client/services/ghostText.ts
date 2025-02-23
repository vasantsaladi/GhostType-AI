import { generatePrediction } from "./openai";
import { isSensitiveField } from "../utils/security";
import debounce from "lodash/debounce";

export class GhostTextManager {
  private ghostElement: HTMLDivElement | null = null;
  private currentInput: Element | null = null;
  private cache = new Map<string, string>();
  private isTabPressed = false;
  private lastPrediction: string | null = null;

  constructor() {
    this.initializeGhostElement();
    // Add global keyboard listener
    document.addEventListener("keydown", this.handleGlobalKeyDown, true);
    document.addEventListener("keyup", this.handleGlobalKeyUp, true);
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

  private handleGlobalKeyDown = (event: KeyboardEvent) => {
    if (
      event.key === "Tab" &&
      !event.shiftKey &&
      this.ghostElement?.style.display !== "none"
    ) {
      const activeElement = document.activeElement;
      if (
        activeElement === this.currentInput ||
        (this.currentInput && this.currentInput.contains(activeElement))
      ) {
        event.preventDefault();
        event.stopPropagation();
        this.isTabPressed = true;
        this.applyPrediction();
      }
    }
  };

  private handleGlobalKeyUp = (event: KeyboardEvent) => {
    if (event.key === "Tab") {
      this.isTabPressed = false;
    }
  };

  public attachInputHandler(element: Element) {
    if (element instanceof HTMLElement && isSensitiveField(element)) {
      return;
    }

    // Remove existing listeners
    element.removeEventListener("input", this.handleInput);
    element.removeEventListener("blur", this.handleBlur);
    element.removeEventListener("focus", this.handleFocus);

    // Add listeners
    element.addEventListener("input", this.handleInput);
    element.addEventListener("blur", this.handleBlur);
    element.addEventListener("focus", this.handleFocus);

    // Set data attribute to mark as attached
    element.setAttribute("data-ghost-attached", "true");
  }

  private handleFocus = (event: Event) => {
    const input = event.target as HTMLElement;
    this.currentInput = this.findEditableParent(input);
    const text = this.getInputText(this.currentInput);
    if (text && text.length >= 3) {
      this.handleInput(event);
    }
  };

  private handleBlur = (event: Event) => {
    setTimeout(() => {
      const activeElement = document.activeElement;
      if (!this.currentInput?.contains(activeElement)) {
        this.hideGhostText();
      }
    }, 100);
  };

  private findEditableParent(element: Element | null): Element | null {
    if (!element) return null;
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element.getAttribute("contenteditable") === "true" ||
      element.getAttribute("role") === "textbox"
    ) {
      return element;
    }
    return this.findEditableParent(element.parentElement);
  }

  private handleInput = debounce(async (event: Event) => {
    const input = event.target as HTMLElement;
    if (!input || !this.ghostElement) return;

    const editableElement = this.findEditableParent(input);
    if (!editableElement) return;

    const text = this.getInputText(editableElement);

    // Quick length check first (faster than splitting)
    if (!text || text.length < 3) {
      this.hideGhostText();
      return;
    }

    // Only proceed with word check if we have enough characters
    const words = text.trim().split(/\s+/);
    if (words.length < 1) {
      this.hideGhostText();
      return;
    }

    try {
      const prediction = await this.getPrediction(text);
      if (prediction && prediction !== text) {
        this.showGhostText(prediction, editableElement);
      } else {
        this.hideGhostText();
      }
    } catch (error) {
      console.error("Error getting prediction:", error);
      this.hideGhostText();
    }
  }, 50); // Ultra-fast debounce

  private getInputText(element: Element | null): string {
    if (!element) return "";

    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      return element.value;
    }

    // Handle Gmail's specific editor
    if (element.classList.contains("Am") && element.classList.contains("Al")) {
      return element.textContent || "";
    }

    // Handle Twitter's editor
    if (element.getAttribute("data-text") === "true") {
      return element.textContent || "";
    }

    // Handle Facebook's editor
    if (element.getAttribute("role") === "textbox") {
      return element.textContent || "";
    }

    // General contenteditable
    if (element.getAttribute("contenteditable") === "true") {
      return element.textContent || "";
    }

    return element.textContent || "";
  }

  private async getPrediction(text: string): Promise<string> {
    const cacheKey = text.toLowerCase();

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Maintain cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const prediction = await generatePrediction(text);
    if (prediction) {
      this.cache.set(cacheKey, prediction);
    }
    return prediction;
  }

  private showGhostText(prediction: string, element: Element) {
    if (!this.ghostElement) return;

    const rect = element.getBoundingClientRect();
    const elementWidth = rect.width;
    const computedStyle = window.getComputedStyle(element as HTMLElement);
    const currentText = this.getInputText(element);

    // Fast string operations
    const currentWords = currentText.toLowerCase().split(/\s+/);
    const predictionWords = prediction.toLowerCase().split(/\s+/);

    // Quick length comparison before proceeding
    if (predictionWords.length <= currentWords.length) {
      this.hideGhostText();
      return;
    }

    // Get continuation words (up to 10)
    const continuationWords = predictionWords.slice(
      currentWords.length,
      currentWords.length + 10
    );
    const ghostText = " " + continuationWords.join(" ");

    // Simplified positioning calculation
    const textMetrics = this.measureText(currentText, element as HTMLElement);
    let xOffset = Math.min(textMetrics.width, elementWidth - 50);
    let yOffset = 0;

    // Simple overflow check
    if (xOffset > elementWidth - 100) {
      xOffset = 0;
      yOffset = parseFloat(computedStyle.lineHeight || "0");
    }

    // Set styles directly for better performance
    this.ghostElement.style.position = "absolute";
    this.ghostElement.style.pointerEvents = "none";
    this.ghostElement.style.color = "#666";
    this.ghostElement.style.opacity = "0.6";
    this.ghostElement.style.fontFamily = computedStyle.fontFamily;
    this.ghostElement.style.fontSize = computedStyle.fontSize;
    this.ghostElement.style.lineHeight = computedStyle.lineHeight;
    this.ghostElement.style.whiteSpace = "pre";
    this.ghostElement.style.zIndex = "999999";
    this.ghostElement.style.display = "block";
    this.ghostElement.style.background = "transparent";
    this.ghostElement.style.padding = computedStyle.padding;
    this.ghostElement.style.margin = computedStyle.margin;
    this.ghostElement.style.left = `${rect.left + window.scrollX + xOffset}px`;
    this.ghostElement.style.top = `${rect.top + window.scrollY + yOffset}px`;
    this.ghostElement.style.maxWidth = `${elementWidth - xOffset}px`;
    this.ghostElement.style.overflow = "hidden";
    this.ghostElement.style.textOverflow = "ellipsis";

    this.ghostElement.textContent = ghostText;
    this.currentInput = element;
    this.lastPrediction = prediction;
  }

  private measureText(text: string, element: HTMLElement): { width: number } {
    // Cache the canvas context for better performance
    if (!this._cachedContext) {
      const canvas = document.createElement("canvas");
      this._cachedContext = canvas.getContext("2d");
    }

    if (!this._cachedContext) return { width: 0 };

    const computedStyle = window.getComputedStyle(element);
    this._cachedContext.font = `${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;

    return this._cachedContext.measureText(text);
  }

  // Add canvas context cache
  private _cachedContext: CanvasRenderingContext2D | null = null;

  private hideGhostText = () => {
    if (this.ghostElement) {
      this.ghostElement.style.display = "none";
    }
    this.lastPrediction = null;
  };

  private applyPrediction() {
    if (!this.ghostElement || !this.currentInput || !this.lastPrediction)
      return;

    try {
      const currentText = this.getInputText(this.currentInput);
      const currentWords = currentText.toLowerCase().split(/\s+/);
      const predictionWords = this.lastPrediction.toLowerCase().split(/\s+/);

      let newText = "";
      if (predictionWords.length <= currentWords.length) {
        // Apply correction
        newText = this.lastPrediction;
      } else {
        // Apply continuation
        const continuationWords = predictionWords.slice(currentWords.length);
        newText = currentText + " " + continuationWords.join(" ");
      }

      if (
        this.currentInput instanceof HTMLInputElement ||
        this.currentInput instanceof HTMLTextAreaElement
      ) {
        this.currentInput.value = newText;
        this.currentInput.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        // Handle contenteditable and custom editors
        const selection = window.getSelection();
        const range = document.createRange();

        this.currentInput.textContent = newText;

        // Create and dispatch multiple events for better compatibility
        const events = [
          new InputEvent("input", { bubbles: true }),
          new Event("change", { bubbles: true }),
        ];

        events.forEach((event) => {
          if (this.currentInput) {
            this.currentInput.dispatchEvent(event);
          }
        });

        // Move cursor to end
        if (selection && this.currentInput.lastChild) {
          range.setStartAfter(this.currentInput.lastChild);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }

      // Trigger a new prediction immediately after applying the current one
      setTimeout(() => {
        if (this.currentInput) {
          const newEvent = new Event("input", { bubbles: true });
          this.handleInput(newEvent);
        }
      }, 50);
    } catch (error) {
      console.error("Error applying prediction:", error);
    }

    this.hideGhostText();
  }
}
