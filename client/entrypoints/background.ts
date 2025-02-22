import { defineBackground } from "wxt/sandbox";

export default defineBackground({
  main() {
    // Create context menu item
    chrome.contextMenus.create({
      id: "enhance-text",
      title: "Enhance with GhostType AI",
      contexts: ["selection", "editable"],
    });

    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === "enhance-text" && tab?.id) {
        chrome.tabs.sendMessage(tab.id, { action: "showEnhanceModal" });
      }
    });

    // Add browser action (toolbar button)
    chrome.action.onClicked.addListener((tab) => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: "showEnhanceModal" });
      }
    });
  },
});
