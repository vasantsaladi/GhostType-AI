import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { getPageContext } from "../services/contextService";

interface Message {
  role: "user" | "assistant";
  content: string;
  model?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  model: string;
  timestamp: number;
}

interface ModelConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
}

interface MultiModelChatProps {
  onClose: () => void;
}

export const MultiModelChat: React.FC<MultiModelChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pageContext, setPageContext] = useState<string>("");
  const [selectedModels, setSelectedModels] = useState<string[]>([
    "gpt-4o-mini",
  ]);
  const [groupChat, setGroupChat] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Available models
  const models: ModelConfig[] = [
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      icon: "🤖",
      color: "#10a37f",
      enabled: true,
    },
    {
      id: "gpt-4o",
      name: "GPT-4o",
      icon: "🧠",
      color: "#10a37f",
      enabled: false,
    },
    {
      id: "claude-3-5-sonnet",
      name: "Claude 3.5 Sonnet",
      icon: "🎭",
      color: "#6b46c1",
      enabled: true,
    },
    {
      id: "claude-3-haiku",
      name: "Claude 3 Haiku",
      icon: "🎭",
      color: "#6b46c1",
      enabled: false,
    },
    {
      id: "gemini-1-5-pro",
      name: "Gemini 1.5 Pro",
      icon: "✨",
      color: "#4285f4",
      enabled: false,
    },
    {
      id: "deepseek-r1",
      name: "DeepSeek-R1",
      icon: "🔍",
      color: "#ff6b6b",
      enabled: false,
    },
    {
      id: "llama-3-70b",
      name: "Llama 3 70B",
      icon: "🦙",
      color: "#fb8c00",
      enabled: false,
    },
  ];

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
              "Hello! I'm your GhostType AI assistant. I've analyzed this page and I'm ready to help you with your writing. You can chat with multiple AI models at once.",
            model: "system",
            timestamp: Date.now(),
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

  const toggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      setSelectedModels(selectedModels.filter((id) => id !== modelId));
    } else {
      setSelectedModels([...selectedModels, modelId]);
    }
  };

  const toggleGroupChat = () => {
    setGroupChat(!groupChat);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || selectedModels.length === 0) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      model: "user",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // If group chat is enabled, send to all selected models at once
      if (groupChat) {
        const promises = selectedModels.map((model) =>
          chrome.runtime.sendMessage({
            type: "MULTI_MODEL_CHAT",
            text: input,
            pageContext,
            model: model,
          })
        );

        // Show "thinking" message for each model
        const thinkingMessages = selectedModels.map((model) => ({
          role: "assistant" as const,
          content: "Thinking...",
          model,
          timestamp: Date.now(),
          isThinking: true,
        }));

        setMessages((prev) => [...prev, ...thinkingMessages]);

        // Wait for all responses
        const responses = await Promise.all(promises);

        // Replace thinking messages with actual responses
        setMessages((prev) => {
          const nonThinkingMessages = prev.filter(
            (msg) => !("isThinking" in msg)
          );
          const responseMessages = responses.map((response, index) => ({
            role: "assistant" as const,
            content: response.text || "Sorry, I couldn't process your request.",
            model: selectedModels[index],
            timestamp: Date.now() + index,
          }));

          return [...nonThinkingMessages, ...responseMessages];
        });
      } else {
        // Send to each selected model sequentially
        for (const model of selectedModels) {
          const response = await chrome.runtime.sendMessage({
            type: "MULTI_MODEL_CHAT",
            text: input,
            pageContext,
            model: model,
          });

          const assistantMessage: ChatMessage = {
            role: "assistant",
            content: response.text || "Sorry, I couldn't process your request.",
            model: model,
            timestamp: Date.now(),
          };

          setMessages((prev) => [...prev, assistantMessage]);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
          model: "system",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getModelConfig = (modelId: string) => {
    return (
      models.find((m) => m.id === modelId) || {
        id: modelId,
        name: modelId,
        icon: "🤖",
        color: "#888",
        enabled: true,
      }
    );
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === "user";
    const isSystem = message.model === "system";
    const modelConfig = getModelConfig(message.model);

    return (
      <div
        key={`${message.timestamp}-${index}`}
        className={`p-3 rounded-lg mb-2 ${
          isUser
            ? "bg-blue-100 ml-8"
            : isSystem
            ? "bg-gray-100 mr-8"
            : "bg-white border border-gray-200 mr-8"
        }`}
      >
        {!isUser && !isSystem && (
          <div className="flex items-center mb-1">
            <span
              className="w-6 h-6 flex items-center justify-center rounded-full mr-2"
              style={{ backgroundColor: modelConfig.color, color: "white" }}
            >
              {modelConfig.icon}
            </span>
            <span className="text-xs font-semibold">{modelConfig.name}</span>
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    );
  };

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-[9999] flex flex-col">
      <div className="p-4 border-b flex justify-between items-center bg-gray-100">
        <h2 className="text-lg font-semibold">GhostType AI</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      <div className="border-b p-2 flex flex-wrap gap-1">
        {models.map((model) => (
          <button
            key={model.id}
            onClick={() => toggleModel(model.id)}
            className={`px-2 py-1 text-xs rounded-full flex items-center ${
              selectedModels.includes(model.id)
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-600"
            }`}
            title={model.name}
          >
            <span className="mr-1">{model.icon}</span>
            <span className="truncate max-w-[80px]">{model.name}</span>
          </button>
        ))}
        <button
          onClick={toggleGroupChat}
          className={`px-2 py-1 text-xs rounded-full flex items-center ${
            groupChat
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-600"
          }`}
          title={groupChat ? "Group chat enabled" : "Group chat disabled"}
        >
          <span className="mr-1">👥</span>
          <span>Group</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || selectedModels.length === 0}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || selectedModels.length === 0}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
        {selectedModels.length === 0 && (
          <p className="text-xs text-red-500 mt-1">
            Please select at least one AI model
          </p>
        )}
      </div>
    </div>
  );
};

export const mountMultiModelChat = (
  container: HTMLElement,
  onClose: () => void
) => {
  const root = document.createElement("div");
  container.appendChild(root);

  try {
    console.log("Creating React root for multi-model chat");
    const reactRoot = createRoot(root);
    reactRoot.render(<MultiModelChat onClose={onClose} />);

    return () => {
      console.log("Unmounting multi-model chat");
      reactRoot.unmount();
      container.removeChild(root);
    };
  } catch (error) {
    console.error("Error mounting multi-model chat:", error);
    return () => {
      if (container.contains(root)) {
        container.removeChild(root);
      }
    };
  }
};
