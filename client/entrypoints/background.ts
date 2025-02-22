export default defineBackground(() => {
  console.log("GhostType AI: Background Service Worker Initialized", {
    id: browser.runtime.id,
  });

  // Handle messages from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "GET_COMPLETION") {
      try {
        const completion = generateSimpleCompletion(request.text);
        sendResponse({ completion, error: null });
      } catch (error) {
        console.error("GhostType AI: Completion error:", error);
        sendResponse({ completion: "", error: error.message });
      }
    }
    return true; // Required for async response
  });
});

// Simple completion function for testing
function generateSimpleCompletion(text: string): string {
  if (!text || typeof text !== "string") return "";

  // Simple word completion logic
  const words = text.toLowerCase().split(/\s+/);
  const lastWord = words[words.length - 1] || "";

  const commonCompletions: { [key: string]: string } = {
    // Common words
    he: "llo",
    wor: "ld",
    th: "ank you",
    tes: "ting",

    // Greetings
    hi: " there",
    hel: "lo",
    hey: " there",

    // Common phrases
    tha: "nk you",
    ple: "ase",
    goo: "d morning",

    // Technical terms
    fun: "ction",
    con: "st",
    let: " ",
    var: "iable",

    // Questions
    wha: "t",
    whe: "re",
    how: " are you",
  };

  // Check for exact matches first
  if (commonCompletions[lastWord]) {
    return commonCompletions[lastWord];
  }

  // Check for partial matches
  for (const [prefix, completion] of Object.entries(commonCompletions)) {
    if (lastWord.startsWith(prefix) && lastWord.length <= prefix.length) {
      return completion;
    }
  }

  return "";
}
