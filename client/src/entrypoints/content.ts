export default defineContentScript({
  matches: ["*://*.google.com/*"],
  main() {
    console.log("Hello content.");

    const INPUT_SELECTORS = [
      "textarea",
      'input[type="text"]',
      'div[contenteditable="true"]',
    ];

    const trackActiveInput = (): HTMLElement | null => {
      const activeEl = document.activeElement as HTMLElement;
      return INPUT_SELECTORS.some((selector) => activeEl?.matches(selector)) &&
        getComputedStyle(activeEl).visibility === "visible"
        ? activeEl
        : null;
    };

    // MutationObserver for dynamic inputs
    new MutationObserver(() => {
      const input = trackActiveInput();
      if (input)
        chrome.runtime.sendMessage({
          type: "INPUT_DETECTED",
          element: input.id,
        });
    }).observe(document.body, { subtree: true, childList: true });
  },
});
