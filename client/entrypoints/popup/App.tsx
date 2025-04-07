import React, { useEffect, useState } from "react";

export default function App() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Detect if user is on Mac
    setIsMac(navigator.platform.includes("Mac"));
  }, []);

  const openSidebar = async () => {
    console.log("openSidebar called");
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const tab = tabs[0];
      console.log("Active tab:", tab);

      if (tab.id) {
        console.log("Sending toggleSidebar message to tab:", tab.id);

        // First try sending directly to the content script
        chrome.tabs.sendMessage(
          tab.id,
          { action: "toggleSidebar" },
          (response) => {
            console.log("Response from content script:", response);
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
    console.log("openMultiModelChat called");
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const tab = tabs[0];

      if (tab.id) {
        chrome.tabs.sendMessage(
          tab.id,
          { action: "toggleMultiModelChat" },
          (response) => {
            console.log("Response from content script:", response);
            window.close();
          }
        );
      } else {
        console.error("No tab ID available");
      }
    } catch (error) {
      console.error("Error in openMultiModelChat:", error);
    }
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
    window.close();
  };

  return (
    <div className="flex flex-col h-full p-4 bg-gray-50">
      <h1 className="text-xl font-bold mb-4 text-center">GhostType AI</h1>

      <div className="flex flex-col gap-3">
        <button
          onClick={openSidebar}
          className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            Open Sidebar
          </div>
          <span className="text-xs opacity-75">{isMac ? "⌘+G" : "Alt+G"}</span>
        </button>

        <button
          onClick={openMultiModelChat}
          className="flex items-center justify-between px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
              />
            </svg>
            Multi-Model Chat
          </div>
          <span className="text-xs opacity-75">{isMac ? "⌘+M" : "Alt+M"}</span>
        </button>

        <button
          onClick={openOptions}
          className="flex items-center justify-between px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors mt-2"
        >
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </div>
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p className="text-center">Keyboard shortcuts:</p>
        <p className="text-center">{isMac ? "⌘+G" : "Alt+G"}: Toggle Sidebar</p>
        <p className="text-center">
          {isMac ? "⌘+M" : "Alt+M"}: Multi-Model Chat
        </p>
      </div>
    </div>
  );
}
