import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { getPageContext } from "../services/contextService";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SidebarProps {
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pageContext, setPageContext] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get page context when sidebar is opened
    const fetchPageContext = async () => {
      setIsLoading(true);
      try {
        const context = await getPageContext();
        setPageContext(context);

        // Add initial assistant message with context
        setMessages([
          {
            role: "assistant",
            content:
              "Hello! I'm your GhostType AI assistant. I've analyzed this page and I'm ready to help you with your writing.",
          },
        ]);
      } catch (error) {
        console.error("Error fetching page context:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPageContext();
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        type: "CHAT_MESSAGE",
        text: input,
        pageContext,
      });

      // Add assistant response
      const assistantMessage: Message = {
        role: "assistant",
        content: response.text || "Sorry, I couldn't process your request.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        right: "0",
        top: "0",
        height: "100vh",
        width: "320px",
        backgroundColor: "white",
        boxShadow: "-2px 0 10px rgba(0, 0, 0, 0.2)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f7fafc",
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>GhostType AI</h2>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "20px",
            color: "#4a5568",
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: message.role === "user" ? "#ebf8ff" : "#f7fafc",
              marginLeft: message.role === "user" ? "32px" : "0",
              marginRight: message.role === "user" ? "0" : "32px",
            }}
          >
            <p style={{ fontSize: "14px" }}>{message.content}</p>
          </div>
        ))}
        {isLoading && (
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "#f7fafc",
              marginRight: "32px",
            }}
          >
            <p style={{ fontSize: "14px" }}>Thinking...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          padding: "16px",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "8px",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: "8px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              outline: "none",
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            style={{
              backgroundColor: "#4299e1",
              color: "white",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export const mountSidebar = (container: HTMLElement, onClose: () => void) => {
  console.log("mountSidebar called with container:", container);

  try {
    // Clear any existing content in the container
    container.innerHTML = "";

    // Set container styles to ensure it's visible on Mac
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

    // Create root element
    const root = document.createElement("div");
    root.style.width = "100%";
    root.style.height = "100%";
    root.style.display = "block";
    root.style.visibility = "visible";
    console.log("Created root element for sidebar:", root);

    // Append root to container
    container.appendChild(root);
    console.log("Appended root to container");

    console.log("Creating React root for sidebar");
    const reactRoot = createRoot(root);
    console.log("React root created, rendering Sidebar component");
    reactRoot.render(<Sidebar onClose={onClose} />);
    console.log("Sidebar component rendered");

    // Return unmount function
    return (unmountContainer: HTMLElement) => {
      console.log("Unmounting sidebar");
      try {
        reactRoot.unmount();
        console.log("React root unmounted");

        if (unmountContainer && unmountContainer.contains(root)) {
          unmountContainer.removeChild(root);
          console.log("Root element removed from container");
        }
      } catch (error) {
        console.error("Error unmounting sidebar:", error);
      }
    };
  } catch (error) {
    console.error("Error mounting sidebar:", error);
    return () => {
      console.log("Calling empty unmount function due to previous error");
    };
  }
};
