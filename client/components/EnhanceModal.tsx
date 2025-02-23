import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

interface EnhanceModalProps {
  onEnhance: (text: string) => Promise<string>;
}

const EnhanceModal: React.FC<EnhanceModalProps> = ({ onEnhance }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [originalText, setOriginalText] = useState("");
  const [enhancedText, setEnhancedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeElement, setActiveElement] = useState<Element | null>(null);

  const enhance = async (text: string) => {
    setIsLoading(true);
    setError("");
    try {
      const result = await onEnhance(text);
      setEnhancedText(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to enhance text");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    enhance(originalText);
  };

  const handleApply = () => {
    if (!enhancedText || !activeElement) return;

    try {
      // Handle different types of editable elements
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement
      ) {
        // For standard input/textarea elements
        const input = activeElement;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        input.setRangeText(enhancedText, start, end, "select");
      } else if (
        activeElement.getAttribute("contenteditable") === "true" ||
        activeElement.closest('[contenteditable="true"]')
      ) {
        // For contenteditable elements (like Facebook, Twitter editors)
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();

          // Create a temporary div to properly handle HTML content
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = enhancedText;

          // Insert each node from the enhanced text
          const fragment = document.createDocumentFragment();
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
          }

          range.insertNode(fragment);
          range.collapse(false);
        }
      } else {
        // Fallback for other types of elements
        const event = new CustomEvent("enhancedTextReady", {
          detail: { text: enhancedText },
        });
        document.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Error applying enhanced text:", error);
    }

    handleClose();
  };

  const handleClose = () => {
    setIsVisible(false);
    setOriginalText("");
    setEnhancedText("");
    setError("");
    setActiveElement(null);
  };

  useEffect(() => {
    const handleShowModal = (event: CustomEvent) => {
      setOriginalText(event.detail.text);
      setIsVisible(true);
      setActiveElement(document.activeElement);
      enhance(event.detail.text);
    };

    const container = document.getElementById("ghosttype-modal");
    if (container) {
      container.addEventListener("showModal", handleShowModal as EventListener);
      return () => {
        container.removeEventListener(
          "showModal",
          handleShowModal as EventListener
        );
      };
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[999999]">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-[90%] relative z-10">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Original Text:</h3>
          <div className="border border-gray-200 rounded p-3 bg-gray-50">
            {originalText}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Enhanced Version:</h3>
          <div className="border border-gray-200 rounded p-3 min-h-[100px]">
            {isLoading ? (
              <div className="text-gray-500">
                Generating enhanced version...
              </div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <div>{enhancedText}</div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={handleRegenerate}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Generating..." : "Regenerate"}
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            disabled={!enhancedText || isLoading}
          >
            Apply
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const mountEnhanceModal = (
  container: HTMLElement,
  onEnhance: (text: string) => Promise<string>
) => {
  const root = createRoot(container);
  root.render(<EnhanceModal onEnhance={onEnhance} />);
  return root;
};
