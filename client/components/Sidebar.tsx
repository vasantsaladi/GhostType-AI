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
  const [pageContext, setPageContext] = useState("");
  const [enhancedContext, setEnhancedContext] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPageContext = async () => {
      try {
        // Get the raw context
        const context = await chrome.runtime.sendMessage({
          type: "GET_CONTEXT",
        });

        // Try to parse as JSON for enhanced context
        try {
          const parsedContext = JSON.parse(context);
          setEnhancedContext(parsedContext);
          setPageContext(parsedContext.text || context);

          // If there's a selection, automatically set it as the input
          if (
            parsedContext.selection &&
            parsedContext.selection.length > 0 &&
            parsedContext.selection.length < 200
          ) {
            setInput(`Help me improve this text: "${parsedContext.selection}"`);
          }

          // Add a welcome message based on the context
          let welcomeMessage =
            "Hello! I'm your GhostType AI assistant. How can I help you with your writing?";

          if (parsedContext.isEditing) {
            welcomeMessage =
              "I see you're editing content. Would you like help with writing, editing, or formatting?";
          } else if (parsedContext.url.includes("mail.google.com")) {
            welcomeMessage =
              "I see you're in Gmail. Need help drafting an email or responding to a message?";
          } else if (parsedContext.url.includes("docs.google.com")) {
            welcomeMessage =
              "I notice you're working in Google Docs. Need help with your document?";
          } else if (parsedContext.selection) {
            welcomeMessage = `I see you've selected some text. Would you like me to help improve or expand on "${parsedContext.selection.substring(
              0,
              50
            )}${parsedContext.selection.length > 50 ? "..." : ""}"?`;
          }

          setMessages([{ role: "assistant", content: welcomeMessage }]);
        } catch (e) {
          // If parsing fails, use the raw context
          setPageContext(context);
          setMessages([
            {
              role: "assistant",
              content:
                "Hello! I'm your GhostType AI assistant. How can I help you with your writing?",
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching context:", error);
        setPageContext("");
        setMessages([
          {
            role: "assistant",
            content:
              "Hello! I'm your GhostType AI assistant. I couldn't access the page context, but I'm still here to help with your writing needs.",
          },
        ]);
      }
    };

    fetchPageContext();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      // Include enhanced context in the request if available
      const contextToSend = enhancedContext
        ? JSON.stringify(enhancedContext)
        : pageContext;

      const response = await chrome.runtime.sendMessage({
        type: "CHAT_MESSAGE",
        text: userMessage,
        pageContext: contextToSend,
      });

      if (response.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${response.error}` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.text },
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error processing your request. Please try again.",
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

    // Add a class to the body to indicate sidebar is open
    document.body.classList.add("ghosttype-sidebar-open");

    // Create root element
    const root = document.createElement("div");
    root.style.width = "100%";
    root.style.height = "100%";
    root.style.display = "block";
    root.style.visibility = "visible";
    console.log("Created root element for sidebar:", root);

    container.appendChild(root);
    console.log("Appended root to container");

    console.log("Creating React root for sidebar");
    const reactRoot = createRoot(root);
    console.log("Rendering Sidebar component");
    reactRoot.render(<Sidebar onClose={onClose} />);
    console.log("Sidebar component rendered");

    // Return unmount function
    return (unmountContainer: HTMLElement) => {
      console.log("Unmounting sidebar");
      try {
        reactRoot.unmount();
        console.log("React root unmounted");

        // Remove the class from body
        document.body.classList.remove("ghosttype-sidebar-open");

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
      // Remove the class from body even in case of error
      document.body.classList.remove("ghosttype-sidebar-open");
    };
  }
};
