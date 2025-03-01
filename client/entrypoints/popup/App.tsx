import React, { useEffect, useState } from "react";

export default function App() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Detect if user is on Mac
    setIsMac(navigator.platform.includes("Mac"));
  }, []);

  const openSidebar = async () => {
    console.log("openSidebar called in popup");
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      console.log("Active tab:", tab);
      if (tab.id) {
        console.log("Sending toggleSidebar message to tab:", tab.id);

        // First try sending directly to the content script
        chrome.tabs.sendMessage(
          tab.id,
          { action: "toggleSidebar" },
          (response) => {
            console.log("Received response from content script:", response);
            if (chrome.runtime.lastError) {
              console.error("Error sending message:", chrome.runtime.lastError);

              // If direct message fails, try sending through the background script
              console.log("Trying to send message through background script");
              chrome.runtime.sendMessage(
                { action: "toggleSidebar" },
                (bgResponse) => {
                  console.log("Response from background script:", bgResponse);
                  window.close();
                }
              );
            } else {
              window.close();
            }
          }
        );
      } else {
        console.error("No tab ID available");
      }
    } catch (error) {
      console.error("Error in openSidebar:", error);
    }
  };

  const openMultiModelChat = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: "toggleMultiModelChat" });
      window.close();
    }
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
    window.close();
  };

  return (
    <div className="w-64 p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">GhostType AI</h1>
        <button
          onClick={openOptions}
          className="text-gray-500 hover:text-gray-700"
          title="Settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        <button
          onClick={openSidebar}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z"
              clipRule="evenodd"
            />
          </svg>
          Open Sidebar
        </button>

        <button
          onClick={openMultiModelChat}
          className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center justify-center transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
          </svg>
          Multi-Model Chat
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Keyboard shortcuts:</p>
        <div className="flex justify-between text-xs text-gray-600">
          <span>Alt + G: Toggle Sidebar</span>
          <span>Alt + M: Multi-Model Chat</span>
        </div>
      </div>
    </div>
  );
}
