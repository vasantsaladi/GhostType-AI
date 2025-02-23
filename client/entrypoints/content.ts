import { defineContentScript } from "wxt/sandbox";
import { mountEnhanceModal } from "../components/EnhanceModal";
import { GhostTextManager } from "../services/ghostText";

// Define selectors for editable elements
const EDITABLE_SELECTORS = [
  'input[type="text"]',
  "textarea",
  '[contenteditable="true"]',
  '[role="textbox"]',
  // Common rich text editor classes/elements
  ".ql-editor", // Quill
  ".ProseMirror", // ProseMirror
  ".tox-edit-area", // TinyMCE
  ".cke_editable", // CKEditor
  "[data-lexical-editor]", // Lexical
  // Gmail specific
  ".Am.Al.editable",
  // Twitter/X specific
  '[data-text="true"]',
  // Facebook specific
  '.notranslate[role="textbox"]',
  '[aria-label*="What\'s on your mind"]',
  '[aria-label*="Write a comment"]',
];

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    // Initialize ghost text manager
    const ghostTextManager = new GhostTextManager();

    // Function to scan for and attach handlers to editable elements
    const scanForEditableElements = () => {
      const elements = document.querySelectorAll(EDITABLE_SELECTORS.join(","));
      elements.forEach((element) => {
        ghostTextManager.attachInputHandler(element);
      });
    };

    // Initial scan
    scanForEditableElements();

    // Set up observer for dynamic content
    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const mutation of mutations) {
        if (
          mutation.type === "childList" ||
          (mutation.type === "attributes" &&
            mutation.attributeName === "contenteditable")
        ) {
          shouldScan = true;
          break;
        }
      }
      if (shouldScan) {
        scanForEditableElements();
      }
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["contenteditable"],
    });

    // Create modal container for text enhancement
    const modalContainer = document.createElement("div");
    modalContainer.id = "enhance-modal-container";
    document.body.appendChild(modalContainer);

    // Mount React modal
    mountEnhanceModal(modalContainer, async (text: string) => {
      try {
        const response = await chrome.runtime.sendMessage({
          type: "ENHANCE_TEXT",
          text,
        });
        if (response.error) {
          return Promise.reject(response.error);
        }
        return Promise.resolve(response.text);
      } catch (error) {
        console.error("Error enhancing text:", error);
        return Promise.reject(error);
      }
    });

    // Add styles for ghost text
    const style = document.createElement("style");
    style.textContent = `
      .ghost-text {
        position: absolute;
        pointer-events: none;
        color: #666;
        opacity: 0.5;
        background: transparent;
        z-index: 999999;
      }
    `;
    document.head.appendChild(style);
  },
});
