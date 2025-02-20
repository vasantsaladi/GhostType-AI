// Model warm-up and initialization
chrome.runtime.onInstalled.addListener(async () => {
  try {
    // Ensure AI API is available
    if (!window.ai?.languageModel) {
      console.warn(
        "Chrome AI API not available. Please enable required flags."
      );
      return;
    }

    // Warm up the model with a simple prompt
    const session = await window.ai.languageModel.createTextSession();
    await session.prompt("Hello");

    console.log("Gemini Nano model initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Gemini Nano model:", error);
  }
});
