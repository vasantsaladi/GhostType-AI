import { defineContentScript } from "wxt/sandbox";
import { generateImprovedEmail } from "../services/claude";

export default defineContentScript({
  matches: ["<all_urls>"],
  async main(ctx) {
    console.log("GhostType AI: Content script loaded");

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "showEnhanceModal") {
        showEnhanceModal();
      }
    });
  },
});

const showEnhanceModal = async () => {
  // Get selected text or active element text
  const selectedText = window.getSelection()?.toString() || "";
  const activeElement = document.activeElement as
    | HTMLTextAreaElement
    | HTMLInputElement;
  const textToEnhance = selectedText || activeElement?.value || "";

  if (!textToEnhance) {
    alert("Please select some text or click into a text field to enhance");
    return;
  }

  // Create modal content
  const modalContent = document.createElement("div");
  modalContent.innerHTML = `
    <div class="ghosttype-modal" style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 999999;
      max-width: 600px;
      width: 90%;
    ">
      <div style="margin-bottom: 16px;">
        <h3 style="font-size: 18px; margin-bottom: 8px;">Original Text:</h3>
        <div style="border: 1px solid #eee; padding: 12px; border-radius: 4px; background: #f8f8f8;">
          ${textToEnhance}
        </div>
      </div>
      <div>
        <h3 style="font-size: 18px; margin-bottom: 8px;">Enhanced Version:</h3>
        <div id="enhanced-content" style="border: 1px solid #eee; padding: 12px; border-radius: 4px; min-height: 100px;">
          Generating enhanced version...
        </div>
      </div>
      <div style="margin-top: 16px; text-align: right;">
        <button id="ghosttype-apply" style="
          background: #4F46E5;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          margin-left: 8px;
          cursor: pointer;
        ">Apply</button>
        <button id="ghosttype-regenerate" style="
          background: #6B7280;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          margin-left: 8px;
          cursor: pointer;
        ">Regenerate</button>
        <button id="ghosttype-close" style="
          background: #EF4444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          margin-left: 8px;
          cursor: pointer;
        ">Close</button>
      </div>
    </div>
  `;

  // Add modal to page
  document.body.appendChild(modalContent);

  // Add event listeners
  const closeBtn = document.getElementById("ghosttype-close");
  const applyBtn = document.getElementById("ghosttype-apply");
  const regenerateBtn = document.getElementById("ghosttype-regenerate");
  const enhancedContent = document.getElementById("enhanced-content");

  closeBtn?.addEventListener("click", () => {
    modalContent.remove();
  });

  applyBtn?.addEventListener("click", () => {
    const enhancedText = enhancedContent?.textContent;
    if (enhancedText && enhancedText !== "Generating enhanced version...") {
      if (selectedText) {
        document.execCommand("insertText", false, enhancedText);
      } else if (activeElement) {
        activeElement.value = enhancedText;
      }
    }
    modalContent.remove();
  });

  regenerateBtn?.addEventListener("click", async () => {
    if (enhancedContent) {
      enhancedContent.textContent = "Regenerating...";
      const improved = await generateImprovedEmail(textToEnhance);
      enhancedContent.textContent = improved;
    }
  });

  // Generate initial enhancement
  if (enhancedContent) {
    const improved = await generateImprovedEmail(textToEnhance);
    enhancedContent.textContent = improved;
  }
};
