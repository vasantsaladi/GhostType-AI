/**
 * Service to extract context from the current webpage
 */

/**
 * Extracts the most relevant content from the current webpage
 * @returns A string containing the page context
 */
export async function getPageContext(): Promise<string> {
  try {
    // Get page title
    const title = document.title;

    // Get meta description
    const metaDescription =
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content") || "";

    // Get URL
    const url = window.location.href;

    // Get main content
    const mainContent = extractMainContent();

    // Get active element context if it's an input field
    const activeElementContext = getActiveElementContext();

    // Combine all context
    const fullContext = [
      `Page Title: ${title}`,
      `URL: ${url}`,
      metaDescription ? `Description: ${metaDescription}` : "",
      `Current Page Content: ${mainContent}`,
      activeElementContext
        ? `Current Input Context: ${activeElementContext}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    return fullContext;
  } catch (error) {
    console.error("Error getting page context:", error);
    return "Failed to extract page context";
  }
}

/**
 * Extracts the main content from the page
 */
function extractMainContent(): string {
  // Try to find the main content container
  const contentSelectors = [
    "main",
    "article",
    "#content",
    ".content",
    "#main",
    ".main",
  ];

  let mainElement: Element | null = null;

  // Try each selector
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      mainElement = element;
      break;
    }
  }

  // If no main content container found, use body
  if (!mainElement) {
    // Try to exclude navigation, header, footer, and sidebar
    const bodyClone = document.body.cloneNode(true) as HTMLElement;

    const elementsToRemove = [
      "header",
      "nav",
      "footer",
      "aside",
      ".header",
      ".nav",
      ".footer",
      ".sidebar",
      ".ads",
      ".advertisement",
      "#header",
      "#nav",
      "#footer",
      "#sidebar",
    ];

    elementsToRemove.forEach((selector) => {
      const elements = bodyClone.querySelectorAll(selector);
      elements.forEach((el) => el.parentNode?.removeChild(el));
    });

    mainElement = bodyClone;
  }

  // Extract text content
  let content = mainElement.textContent || "";

  // Clean up the content
  content = content.replace(/\s+/g, " ").trim().substring(0, 1500); // Limit to 1500 characters

  return content;
}

/**
 * Gets context from the currently active element if it's an input field
 */
function getActiveElementContext(): string | null {
  const activeElement = document.activeElement;

  if (!activeElement) return null;

  // Check if it's an input field
  if (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement.getAttribute("contenteditable") === "true"
  ) {
    // Get the input value or text content
    let inputText = "";

    if (
      activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement
    ) {
      inputText = activeElement.value;
    } else {
      inputText = activeElement.textContent || "";
    }

    // Get label if available
    let label = "";
    if (activeElement.id) {
      const labelElement = document.querySelector(
        `label[for="${activeElement.id}"]`
      );
      if (labelElement) {
        label = labelElement.textContent || "";
      }
    }

    // Get placeholder
    const placeholder = activeElement.getAttribute("placeholder") || "";

    // Get surrounding form context
    let formContext = "";
    const form = activeElement.closest("form");
    if (form) {
      // Get form action
      const formAction = form.getAttribute("action") || "";

      // Get other form field labels
      const formLabels = Array.from(form.querySelectorAll("label"))
        .map((label) => label.textContent?.trim())
        .filter(Boolean)
        .join(", ");

      formContext = `Form: ${
        formAction ? `Action: ${formAction}, ` : ""
      }Fields: ${formLabels}`;
    }

    return [
      label ? `Label: ${label}` : "",
      placeholder ? `Placeholder: ${placeholder}` : "",
      inputText ? `Current text: ${inputText}` : "",
      formContext,
    ]
      .filter(Boolean)
      .join(", ");
  }

  return null;
}

/**
 * Updates the GhostType prediction service with the current page context
 * @param context The page context to use for predictions
 */
export function updateGhostTypeContext(context: string): void {
  // Send message to update the context
  chrome.runtime.sendMessage({
    type: "UPDATE_CONTEXT",
    context,
  });
}
