export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    console.log("GhostType AI: Content Script Initialized");

    // Create and style the suggestion overlay
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      background: transparent;
      pointer-events: none;
      color: #666;
      z-index: 2147483647;
      display: none;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: inherit;
    `;
    document.body.appendChild(overlay);

    // Debounce function to limit API calls
    function debounce<T extends (...args: any[]) => any>(
      func: T,
      wait: number
    ): (...args: Parameters<T>) => void {
      let timeout: number | undefined;
      return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait) as unknown as number;
      };
    }

    // Function to get completion from background script
    async function getCompletion(text: string): Promise<string> {
      if (!text.trim()) return "";

      try {
        const response = await chrome.runtime.sendMessage({
          type: "GET_COMPLETION",
          text: text.trim(),
        });
        return response?.completion || "";
      } catch (error) {
        console.error("GhostType AI: Error getting completion:", error);
        return "";
      }
    }

    // Function to sync styles between input and overlay
    function syncStyles(source: Element, overlay: HTMLElement) {
      const style = window.getComputedStyle(source);
      const rect = source.getBoundingClientRect();

      // Copy all relevant styles
      overlay.style.cssText = `
        position: fixed;
        background: transparent;
        pointer-events: none;
        color: #666;
        z-index: 2147483647;
        font-family: ${style.fontFamily};
        font-size: ${style.fontSize};
        font-weight: ${style.fontWeight};
        letter-spacing: ${style.letterSpacing};
        line-height: ${style.lineHeight};
        padding: ${style.padding};
        border: ${style.border};
        white-space: pre-wrap;
        word-wrap: break-word;
        left: ${rect.left + window.scrollX}px;
        top: ${rect.top + window.scrollY}px;
        width: ${rect.width}px;
        min-height: ${rect.height}px;
      `;
    }

    // Function to show completion in overlay
    function showCompletion(element: Element, completion: string) {
      if (!completion) {
        overlay.style.display = "none";
        return;
      }

      const input = element as HTMLInputElement | HTMLTextAreaElement;
      const currentText = input.value || "";

      overlay.textContent = currentText + completion;
      overlay.style.display = "block";
      syncStyles(element, overlay);
    }

    // Handle input events with debouncing
    const debouncedHandleInput = debounce(
      async (element: Element, text: string) => {
        const completion = await getCompletion(text);
        showCompletion(element, completion);
      },
      200 // Reduced debounce time for better responsiveness
    );

    // Function to attach event handlers to text input elements
    function attachHandler(element: Element) {
      if (element.getAttribute("data-ghosttype-handled")) return;

      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element.getAttribute("contenteditable") === "true"
      ) {
        console.log("GhostType AI: Attaching handler to", element);

        // Input event for getting completions
        element.addEventListener("input", (event) => {
          const target = event.target as HTMLInputElement | HTMLTextAreaElement;
          debouncedHandleInput(element, target.value || "");
        });

        // Tab key to accept completion
        element.addEventListener("keydown", (event: Event) => {
          const e = event as KeyboardEvent;
          if (e.key === "Tab" && overlay.style.display !== "none") {
            e.preventDefault();
            e.stopPropagation();

            const target = e.target as HTMLInputElement | HTMLTextAreaElement;
            const currentValue = target.value || "";
            const completion = overlay.textContent?.slice(currentValue.length);

            if (completion) {
              target.value = currentValue + completion;
              overlay.style.display = "none";

              // Trigger input event to notify any listeners
              target.dispatchEvent(new Event("input", { bubbles: true }));
            }
          }

          // Handle escape key
          if (e.key === "Escape") {
            overlay.style.display = "none";
          }
        });

        // Hide completion on blur
        element.addEventListener("blur", () => {
          overlay.style.display = "none";
        });

        // Update overlay position on scroll or resize
        const updatePosition = debounce(() => {
          if (overlay.style.display !== "none") {
            syncStyles(element, overlay);
          }
        }, 100);

        window.addEventListener("scroll", updatePosition, { passive: true });
        window.addEventListener("resize", updatePosition, { passive: true });

        element.setAttribute("data-ghosttype-handled", "true");
      }
    }

    // Create a MutationObserver to watch for new text input elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof Element) {
              attachHandler(node);
              node
                .querySelectorAll('input, textarea, [contenteditable="true"]')
                .forEach(attachHandler);
            }
          });
        }
      });
    });

    // Start observing the entire document
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
    });

    // Initial scan of existing elements
    document
      .querySelectorAll('input, textarea, [contenteditable="true"]')
      .forEach(attachHandler);
  },
});
