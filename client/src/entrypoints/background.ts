import { defineBackground } from "wxt/sandbox";

export default defineBackground(() => {
  console.log("GhostType extension background script initialized");

  // Future: Add message passing, AI session management, etc.
  chrome.runtime.onInstalled.addListener(() => {
    console.log("GhostType extension installed");
  });
});
