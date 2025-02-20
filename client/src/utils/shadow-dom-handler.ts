// Utility function to create a Shadow DOM handler for text fields
export function createShadowRootHandler(element: Element) {
  // Check if the element supports Shadow DOM
  if (!(element instanceof HTMLElement)) return;

  // Create a shadow root if not already exists
  const existingShadow = element.shadowRoot;
  if (existingShadow) return;

  const shadowRoot = element.attachShadow({ mode: "open" });

  // Create a container for potential overlays or AI suggestions
  const container = document.createElement("div");
  container.classList.add("ghosttype-shadow-container");

  // Style the container to ensure it doesn't interfere with the original element
  container.style.all = "initial";
  container.style.position = "absolute";
  container.style.zIndex = "2147483647"; // Highest z-index
  container.style.pointerEvents = "none";

  // Append the container to the shadow root
  shadowRoot.appendChild(container);

  // Optional: Sync styles from the original element
  function syncStyles() {
    try {
      const computedStyle = window.getComputedStyle(element);
      container.style.font = computedStyle.font;
      container.style.color = computedStyle.color;
      container.style.letterSpacing = computedStyle.letterSpacing;
      container.style.lineHeight = computedStyle.lineHeight;
    } catch (error) {
      console.warn("GhostType: Could not sync styles", error);
    }
  }

  // Initial style sync
  syncStyles();

  // Attach a resize observer to keep styles in sync
  const resizeObserver = new ResizeObserver(syncStyles);
  resizeObserver.observe(element);

  // Store references for potential future cleanup
  (element as any).__ghosttypeShadowRoot = shadowRoot;
  (element as any).__ghosttypeResizeObserver = resizeObserver;
}

// Optional cleanup function
export function removeShadowRoot(element: Element) {
  if (!(element instanceof HTMLElement)) return;

  const shadowRoot = (element as any).__ghosttypeShadowRoot;
  const resizeObserver = (element as any).__ghosttypeResizeObserver;

  if (shadowRoot) {
    shadowRoot.removeChild(shadowRoot.firstChild);
    element.shadowRoot?.removeChild(shadowRoot);
  }

  if (resizeObserver) {
    resizeObserver.disconnect();
  }

  delete (element as any).__ghosttypeShadowRoot;
  delete (element as any).__ghosttypeResizeObserver;
}

export default { createShadowRootHandler, removeShadowRoot };
