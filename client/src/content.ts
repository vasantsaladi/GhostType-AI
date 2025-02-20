import { createShadowRootHandler } from "./utils/shadow-dom-handler";

// Type definition for the handler function
type TextFieldHandler = (element: Element) => void;

class TextFieldObserver {
  private observer: MutationObserver;
  private handlers: TextFieldHandler[] = [];

  constructor() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" || mutation.type === "attributes") {
          this.scanAndAttachHandlers();
        }
      });
    });
  }

  // Method to add custom handlers
  addHandler(handler: TextFieldHandler) {
    this.handlers.push(handler);
  }

  // Scan and attach handlers to matching elements
  private scanAndAttachHandlers() {
    const textFields = document.querySelectorAll(
      'input, textarea, [contenteditable="true"]'
    );

    textFields.forEach((element) => {
      if (!element.getAttribute("data-ghosttype-handled")) {
        this.handlers.forEach((handler) => handler(element));
        element.setAttribute("data-ghosttype-handled", "true");
      }
    });
  }

  // Start observing the document
  start() {
    this.observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
    });

    // Initial scan
    this.scanAndAttachHandlers();
  }

  // Stop observing
  stop() {
    this.observer.disconnect();
  }
}

// Default handler for logging and potential future extensions
function defaultTextFieldHandler(element: Element) {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element.getAttribute("contenteditable") === "true"
  ) {
    // Potential future extensions:
    // 1. Attach AI prediction listeners
    // 2. Set up shadow DOM for overlay
    // 3. Add event listeners for text changes

    console.log("GhostType: Detected text field", element);
  }
}

// Create and start the observer
const textFieldObserver = new TextFieldObserver();
textFieldObserver.addHandler(defaultTextFieldHandler);
textFieldObserver.addHandler(createShadowRootHandler);

// Start observing when the script loads
textFieldObserver.start();

// Export for potential external use or testing
export { TextFieldObserver, textFieldObserver, defaultTextFieldHandler };
