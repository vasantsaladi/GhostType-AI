import { defineBackground } from "wxt/sandbox";
import {
  generateImprovedText,
  generateChatResponse,
  updateContext,
} from "../services/openai";

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

    // Create context menu item for sidebar
    chrome.contextMenus.create({
      id: "open-sidebar",
      title: "Open GhostType AI Sidebar",
      contexts: ["page", "selection", "editable"],
    });

    // Handle messages from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log("GhostType AI: Received message in background", request);

      if (request.type === "ENHANCE_TEXT") {
        handleEnhanceText(request.text, sendResponse);
        return true; // Required for async response
      }

      if (request.type === "CHAT_MESSAGE") {
        handleChatMessage(request.text, request.pageContext, sendResponse);
        return true; // Required for async response
      }

      if (request.type === "UPDATE_CONTEXT") {
        updateContext(request.context);
        sendResponse({ success: true });
        return true;
      }

      if (request.action === "toggleSidebar") {
        console.log("Background received toggleSidebar action from:", sender);
        // Forward the message to the active tab
        if (sender.tab?.id) {
          console.log("Sending toggleSidebar to original tab:", sender.tab.id);
          chrome.tabs.sendMessage(
            sender.tab.id,
            { action: "toggleSidebar" },
            (response) => {
              console.log("Response from content script:", response);
              if (chrome.runtime.lastError) {
                console.error(
                  "Error sending toggleSidebar to tab:",
                  chrome.runtime.lastError
                );
              }
              sendResponse({
                success: true,
                source: "background",
                forwarded: true,
              });
            }
          );
        } else {
          // If message didn't come from a tab, send to active tab
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
              console.log("Sending toggleSidebar to active tab:", tabs[0].id);
              chrome.tabs.sendMessage(
                tabs[0].id,
                { action: "toggleSidebar" },
                (response) => {
                  console.log("Response from content script:", response);
                  if (chrome.runtime.lastError) {
                    console.error(
                      "Error sending toggleSidebar to active tab:",
                      chrome.runtime.lastError
                    );
                  }
                }
              );
              sendResponse({
                success: true,
                source: "background",
                forwarded: true,
              });
            } else {
              console.error(
                "No active tab found to send toggleSidebar message"
              );
              sendResponse({ success: false, error: "No active tab found" });
            }
          });
        }
        return true; // Required for async response
      }

      if (request.type === "MULTI_MODEL_CHAT") {
        console.log(`Processing multi-model chat with model: ${request.model}`);

        // Import dynamically to avoid issues with service worker
        import("../services/openai").then(async (openaiService) => {
          try {
            const response = await openaiService.generateMultiModelResponse(
              request.text,
              request.pageContext || "",
              request.model
            );

            console.log("Multi-model chat response:", response);
            sendResponse(response);
          } catch (error) {
            console.error("Error in multi-model chat:", error);
            sendResponse({
              text: "",
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred",
            });
          }
        });

        return true; // Indicates we will respond asynchronously
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

      if (info.menuItemId === "open-sidebar" && tab?.id) {
        console.log("Context menu: open sidebar clicked");
        chrome.tabs.sendMessage(tab.id, {
          action: "toggleSidebar",
        });
      }
    });

    // Add browser action (toolbar button)
    chrome.action.onClicked.addListener((tab) => {
      console.log("GhostType AI: Extension icon clicked for tab:", tab);
      if (tab.id) {
        console.log(
          "GhostType AI: Sending toggleSidebar message to tab",
          tab.id
        );
        try {
          chrome.tabs.sendMessage(
            tab.id,
            { action: "toggleSidebar" },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error(
                  "Error sending toggleSidebar message:",
                  chrome.runtime.lastError
                );
                // If content script isn't ready, try opening the popup instead
                chrome.action.setPopup({ tabId: tab.id, popup: "popup.html" });
                chrome.action.openPopup();
              } else {
                console.log(
                  "toggleSidebar message sent successfully, response:",
                  response
                );
              }
            }
          );
        } catch (error) {
          console.error("Exception sending toggleSidebar message:", error);
        }
      } else {
        console.error("No tab ID available for sending toggleSidebar message");
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

async function handleChatMessage(
  text: string,
  pageContext: string,
  sendResponse: (response: any) => void
) {
  try {
    const result = await generateChatResponse(text, pageContext);
    if (result.error) {
      sendResponse({ error: result.error });
    } else {
      sendResponse({ text: result.text });
    }
  } catch (error) {
    console.error("Error in chat message handler:", error);
    sendResponse({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
