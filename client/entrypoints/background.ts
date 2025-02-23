import { defineBackground } from "wxt/sandbox";
import { generateImprovedText } from "../services/openai";

declare const __OPENAI_API_KEY__: string;

export default defineBackground({
  main() {
    console.log("GhostType AI: Background script loaded");
    console.log("API Key status:", {
      exists: !!__OPENAI_API_KEY__,
      length: __OPENAI_API_KEY__?.length || 0,
    });

    // Create context menu item
    chrome.contextMenus.create({
      id: "enhance-text",
      title: "Enhance with GhostType AI",
      contexts: ["selection", "editable"],
    });

    // Handle messages from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log("GhostType AI: Received message in background", request);

      if (request.action === "enhanceText") {
        handleEnhanceText(request.text, sendResponse);
        return true; // Required for async response
      }
    });

    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === "enhance-text" && tab?.id) {
        const selectedText = info.selectionText || "";
        if (selectedText) {
          chrome.tabs.sendMessage(tab.id, {
            action: "showEnhanceModal",
            text: selectedText,
          });
        }
      }
    });

    // Add browser action (toolbar button)
    chrome.action.onClicked.addListener((tab) => {
      console.log("GhostType AI: Extension icon clicked");
      if (tab.id) {
        console.log("GhostType AI: Sending message to tab", tab.id);
        chrome.tabs.sendMessage(tab.id, { action: "showEnhanceModal" });
      }
    });
  },
});

async function handleEnhanceText(
  text: string,
  sendResponse: (response: any) => void
) {
  try {
    const result = await generateImprovedText(text);
    if (result.error) {
      sendResponse({ error: result.error });
    } else {
      sendResponse({ text: result.text });
    }
  } catch (error) {
    console.error("Error in background:", error);
    sendResponse({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
