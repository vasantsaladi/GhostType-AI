export default defineContentScript({
  matches: ["*://*/*/*"], // Expanded to match more sites
  main() {
    console.log("GhostType AI: Content Script Initialized");

    // Function to attach event handlers to text input elements
    function attachHandler(element: Element) {
      // Check if the element is already handled
      if (element.getAttribute("data-ghosttype-handled")) return;

      // Identify different types of text input elements
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element.getAttribute("contenteditable") === "true"
      ) {
        console.log("GhostType AI: Attaching handler to", element);

        // Basic event listeners for different input types
        element.addEventListener("input", (event) => {
          const target = event.target as HTMLInputElement | HTMLTextAreaElement;
          console.log("Input detected:", target.value);

          // Placeholder for future AI integration
          // You would call your AI completion logic here
        });

        // Mark the element as handled to prevent duplicate attachments
        element.setAttribute("data-ghosttype-handled", "true");
      }
    }

    // Create a MutationObserver to watch for new text input elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof Element) {
              // Check the added node and its descendants
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
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
    });

    // Initial scan of existing elements
    document
      .querySelectorAll('input, textarea, [contenteditable="true"]')
      .forEach(attachHandler);
  },
});
