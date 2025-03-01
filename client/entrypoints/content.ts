import { defineContentScript } from "wxt/sandbox";
import { getPageContext } from "../services/contextService";
import { mountEnhanceModal } from "../components/EnhanceModal";
import { mountSidebar } from "../components/Sidebar";
import { mountMultiModelChat } from "../components/MultiModelChat";
import { GhostTextManager } from "../services/ghostText";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_end",
  main() {
    console.log("GhostType AI: Content script loaded");

    // Add global styles
    const style = document.createElement("style");
    style.textContent = `
      .ghost-text {
        opacity: 0.5;
        position: absolute;
        pointer-events: none;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        z-index: 1000;
      }
      
      .ghosttype-sidebar-toggle {
        position: fixed;
        right: 20px;
        top: 50%;
        transform: translateY(-50%);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #4a5568;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        z-index: 9998;
        transition: all 0.3s ease;
        border: none;
        outline: none;
      }
      
      .ghosttype-sidebar-toggle:hover {
        background-color: #2d3748;
        transform: translateY(-50%) scale(1.1);
      }
      
      .ghosttype-sidebar-toggle svg {
        width: 24px;
        height: 24px;
      }
    `;
    document.head.appendChild(style);

    // Selectors for editable elements
    const editableSelectors = [
      'input[type="text"]',
      'input[type="search"]',
      "textarea",
      '[contenteditable="true"]',
      '[role="textbox"]',
    ];

    // Track editable elements
    const editableElements = new Set<HTMLElement>();
    const ghostTextManager = new GhostTextManager();

    // Function to scan for editable elements
    function scanForEditableElements() {
      document.querySelectorAll(editableSelectors.join(", ")).forEach((el) => {
        if (el instanceof HTMLElement && !editableElements.has(el)) {
          editableElements.add(el);
          attachInputHandler(el);
        }
      });
    }

    // Set up MutationObserver to watch for new editable elements
    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;

      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          shouldScan = true;
          break;
        }
      }

      if (shouldScan) {
        scanForEditableElements();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Initial scan
    scanForEditableElements();

    // Attach input handler to editable element
    function attachInputHandler(element: HTMLElement) {
      element.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        ghostTextManager.handleInput(target);
      });

      element.addEventListener("keydown", (e) => {
        ghostTextManager.handleKeyDown(e);
      });
    }

    // Create modal container for text enhancement
    const modalContainer = document.createElement("div");
    modalContainer.id = "ghosttype-modal-container";
    document.body.appendChild(modalContainer);

    // Mount React modal
    let unmountEnhanceModal = mountEnhanceModal(modalContainer);

    // Variables for sidebar
    let sidebarContainer: HTMLElement | null = null;
    let unmountSidebar: (() => void) | null = null;
    let isSidebarOpen = false;

    // Variables for multi-model chat
    let multiModelChatContainer: HTMLElement | null = null;
    let unmountMultiModelChat: (() => void) | null = null;
    let isMultiModelChatOpen = false;

    // Function to toggle sidebar
    function toggleSidebar() {
      console.log("toggleSidebar called in content script");
      console.log("Current sidebar state:", {
        isSidebarOpen,
        sidebarContainer: document.getElementById(
          "ghosttype-sidebar-container"
        ),
      });

      try {
        if (isSidebarOpen) {
          console.log("Closing sidebar");
          const container = document.getElementById(
            "ghosttype-sidebar-container"
          );
          if (container) {
            console.log("Removing sidebar container");
            if (typeof unmountSidebar === "function") {
              unmountSidebar(container);
            }
            document.body.removeChild(container);
            console.log("Sidebar container removed from body");
          } else {
            console.warn("Sidebar container not found when trying to close");
          }
          isSidebarOpen = false;
          unmountSidebar = null;
        } else {
          console.log("Opening sidebar");

          // Close multi-model chat if open
          if (isMultiModelChatOpen) {
            console.log("Closing multi-model chat before opening sidebar");
            toggleMultiModelChat();
          }

          // First, ensure any existing sidebar is removed
          const existingContainer = document.getElementById(
            "ghosttype-sidebar-container"
          );
          if (existingContainer) {
            console.log(
              "Removing existing sidebar container before creating new one"
            );
            if (typeof unmountSidebar === "function") {
              unmountSidebar(existingContainer);
            }
            if (existingContainer.parentNode) {
              existingContainer.parentNode.removeChild(existingContainer);
            }
            unmountSidebar = null;
          }

          // Create a new container for the sidebar
          const container = document.createElement("div");
          container.id = "ghosttype-sidebar-container";

          // Set explicit styles to ensure visibility on Mac
          container.style.position = "fixed";
          container.style.top = "0";
          container.style.right = "0";
          container.style.width = "320px";
          container.style.height = "100vh";
          container.style.zIndex = "999999"; // Higher z-index for Mac
          container.style.backgroundColor = "#ffffff";
          container.style.boxShadow = "-2px 0 10px rgba(0, 0, 0, 0.1)";
          container.style.display = "block";
          container.style.overflow = "hidden";
          container.style.border = "none";
          container.style.margin = "0";
          container.style.padding = "0";
          container.style.transform = "translateZ(0)"; // Force hardware acceleration
          container.style.visibility = "visible";
          container.style.opacity = "1";

          // Append to body
          document.body.appendChild(container);
          console.log(
            "Sidebar container created and appended to body:",
            container
          );

          // Update context when opening sidebar
          getPageContext()
            .then((context) => {
              console.log(
                "Got page context:",
                context.substring(0, 100) + "..."
              );
              chrome.runtime.sendMessage({
                type: "UPDATE_CONTEXT",
                context,
              });
            })
            .catch((error) => {
              console.error("Error getting page context:", error);
            });

          try {
            console.log("Mounting sidebar component");
            unmountSidebar = mountSidebar(container, () => {
              toggleSidebar();
            });
            console.log("Unmount function returned:", !!unmountSidebar);
            isSidebarOpen = true;
            console.log("Sidebar successfully mounted and opened");

            // Force a repaint to ensure the sidebar is visible
            setTimeout(() => {
              container.style.opacity = "0.99";
              setTimeout(() => {
                container.style.opacity = "1";
              }, 10);
            }, 0);
          } catch (error) {
            console.error("Error mounting sidebar:", error);
            if (container.parentNode) {
              container.parentNode.removeChild(container);
            }
            isSidebarOpen = false;
            unmountSidebar = null;
          }
        }
      } catch (error) {
        console.error("Error in toggleSidebar:", error);
        isSidebarOpen = false;
        unmountSidebar = null;
      }

      return { success: true, isSidebarOpen };
    }

    // Function to toggle multi-model chat
    function toggleMultiModelChat() {
      if (isMultiModelChatOpen && multiModelChatContainer) {
        console.log("Closing multi-model chat");
        if (unmountMultiModelChat) {
          unmountMultiModelChat();
          unmountMultiModelChat = null;
        }
        if (multiModelChatContainer.parentNode) {
          multiModelChatContainer.parentNode.removeChild(
            multiModelChatContainer
          );
        }
        multiModelChatContainer = null;
        isMultiModelChatOpen = false;
      } else {
        console.log("Opening multi-model chat");
        if (!multiModelChatContainer) {
          multiModelChatContainer = document.createElement("div");
          multiModelChatContainer.id = "ghosttype-multi-model-chat-container";
          document.body.appendChild(multiModelChatContainer);
        }

        // Update page context when multi-model chat is opened
        getPageContext().then((context) => {
          chrome.runtime.sendMessage({
            type: "UPDATE_CONTEXT",
            context,
          });
        });

        unmountMultiModelChat = mountMultiModelChat(
          multiModelChatContainer,
          () => {
            toggleMultiModelChat();
          }
        );
        isMultiModelChatOpen = true;
      }
    }

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("Content script received message:", message);

      try {
        if (message.action === "showEnhanceModal" && message.text) {
          console.log(
            "Showing enhance modal with text:",
            message.text.substring(0, 50) + "..."
          );
          // Remount the modal with the selected text
          if (unmountEnhanceModal) {
            unmountEnhanceModal();
          }
          unmountEnhanceModal = mountEnhanceModal(modalContainer, message.text);
          sendResponse({ success: true, action: "showEnhanceModal" });
        }

        if (message.action === "toggleSidebar") {
          console.log(
            "Received toggleSidebar message, calling toggleSidebar function"
          );
          const result = toggleSidebar();
          console.log("toggleSidebar function called, sidebar state:", {
            isSidebarOpen,
            sidebarContainer: document.getElementById(
              "ghosttype-sidebar-container"
            ),
          });
          sendResponse({
            success: true,
            action: "toggleSidebar",
            isSidebarOpen: result.isSidebarOpen,
            containerExists: !!document.getElementById(
              "ghosttype-sidebar-container"
            ),
          });
        }

        if (message.action === "toggleMultiModelChat") {
          console.log("Received toggleMultiModelChat message");
          toggleMultiModelChat();
          sendResponse({ success: true, action: "toggleMultiModelChat" });
        }
      } catch (error) {
        console.error("Error handling message:", error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          action: message.action,
        });
      }

      return true; // Required for async response
    });

    // Add keyboard shortcut for sidebar (Alt+G)
    document.addEventListener("keydown", (e) => {
      if (e.altKey && e.key === "g") {
        toggleSidebar();
      }

      if (e.altKey && e.key === "m") {
        toggleMultiModelChat();
      }
    });

    // Detect URL changes (for SPAs)
    let lastUrl = location.href;
    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log("URL changed, updating context");
        getPageContext().then((context) => {
          chrome.runtime.sendMessage({
            type: "UPDATE_CONTEXT",
            context,
          });
        });
      }
    }).observe(document, { subtree: true, childList: true });

    // Add sidebar toggle button
    addSidebarButton();
    addMultiModelChatButton();

    // Function to add sidebar toggle button
    function addSidebarButton() {
      const button = document.createElement("button");
      button.className = "ghosttype-sidebar-toggle";
      button.style.right = "20px";
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      `;
      button.title = "Toggle GhostType AI Sidebar";

      button.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "toggleSidebar" });
      });

      document.body.appendChild(button);
    }

    // Function to add multi-model chat button
    function addMultiModelChatButton() {
      const button = document.createElement("button");
      button.className = "ghosttype-sidebar-toggle";
      button.style.right = "70px";
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      `;
      button.title = "Toggle GhostType AI Multi-Model Chat";

      button.addEventListener("click", () => {
        toggleMultiModelChat();
      });

      document.body.appendChild(button);
    }
  },
});
