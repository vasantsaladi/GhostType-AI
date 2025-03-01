declare const __OPENAI_API_KEY__: string;

export interface OpenAIResponse {
  text: string;
  error?: string;
}

// Store the current page context
let currentPageContext = "";

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequestsPerMinute: 20,
  requestTimestamps: [] as number[],
  cooldownPeriod: 60000, // 1 minute in milliseconds
  isRateLimited: false,
  retryAfter: 0,
};

// Update rate limit settings from storage
async function updateRateLimitSettings() {
  try {
    const settings = await chrome.storage.sync.get(["maxRequestsPerMinute"]);
    if (settings.maxRequestsPerMinute) {
      RATE_LIMIT.maxRequestsPerMinute = settings.maxRequestsPerMinute;
      console.log(
        "Rate limit settings updated:",
        RATE_LIMIT.maxRequestsPerMinute
      );
    }
  } catch (error) {
    console.error("Error loading rate limit settings:", error);
  }
}

// Initialize settings
updateRateLimitSettings();

// Update the page context
export function updateContext(context: string): void {
  currentPageContext = context;
  console.log("Context updated for predictions");
}

// Check if we're currently rate limited
function checkRateLimit(): boolean {
  const now = Date.now();

  // If we're in a cooldown period, check if it's over
  if (RATE_LIMIT.isRateLimited) {
    if (now >= RATE_LIMIT.retryAfter) {
      console.log("Rate limit cooldown period ended");
      RATE_LIMIT.isRateLimited = false;
      RATE_LIMIT.requestTimestamps = [];
    } else {
      return true; // Still rate limited
    }
  }

  // Remove timestamps older than 1 minute
  RATE_LIMIT.requestTimestamps = RATE_LIMIT.requestTimestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT.cooldownPeriod
  );

  // Check if we've hit the rate limit
  if (RATE_LIMIT.requestTimestamps.length >= RATE_LIMIT.maxRequestsPerMinute) {
    console.log("Rate limit reached, entering cooldown");
    RATE_LIMIT.isRateLimited = true;
    RATE_LIMIT.retryAfter = now + RATE_LIMIT.cooldownPeriod;
    return true;
  }

  // Add current timestamp to the list
  RATE_LIMIT.requestTimestamps.push(now);
  return false;
}

// Get API key from storage or fallback to environment variable
async function getApiKey(): Promise<string> {
  try {
    const settings = await chrome.storage.sync.get(["openaiApiKey"]);
    if (settings.openaiApiKey) {
      return settings.openaiApiKey;
    }
  } catch (error) {
    console.error("Error loading API key from storage:", error);
  }

  return __OPENAI_API_KEY__;
}

export async function generateImprovedText(
  originalText: string
): Promise<OpenAIResponse> {
  try {
    console.log("Attempting to call OpenAI API...");

    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error(
        "OpenAI API key not found. Please add your API key in the extension settings."
      );
    }

    // Check rate limit
    if (checkRateLimit()) {
      const waitTime = Math.ceil((RATE_LIMIT.retryAfter - Date.now()) / 1000);
      return {
        text: "",
        error: `Rate limit exceeded. Please try again in ${waitTime} seconds.`,
      };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a professional writing assistant. Improve the given text while maintaining its core message and intent. Make it more professional, clear, and engaging." +
              (currentPageContext
                ? ` Consider this context about the current page: ${currentPageContext}`
                : ""),
          },
          {
            role: "user",
            content: `Please enhance this text: ${originalText}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      handleApiError(response);
    }

    const data = await response.json();
    return {
      text: data.choices[0].message.content.trim(),
    };
  } catch (error) {
    console.error("Error generating improved text:", error);
    return {
      text: "",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function generatePrediction(text: string): Promise<string> {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error("OpenAI API key not found");
    }

    // Check rate limit
    if (checkRateLimit()) {
      console.log("Rate limit reached for prediction, skipping request");
      return "";
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a natural text predictor. Continue the user's text naturally, fixing any typos in their input if needed. Keep suggestions brief (2-3 words) and conversational. Never use quotation marks." +
              (currentPageContext
                ? ` Consider this context about the current page: ${currentPageContext}`
                : ""),
          },
          {
            role: "user",
            content: `Continue this text naturally and fix any typos (2-3 words max): ${text}`,
          },
        ],
        temperature: 0.4,
        max_tokens: 10,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      handleApiError(response);
    }

    const data = await response.json();
    let prediction = data.choices[0].message.content.trim();

    // Remove any quotation marks
    prediction = prediction.replace(/['"]/g, "");

    // If the prediction starts with the input text (ignoring case and minor typos),
    // only return the new part
    const inputWords = text.toLowerCase().split(/\s+/);
    const predWords = prediction.toLowerCase().split(/\s+/);

    if (predWords.length > inputWords.length) {
      // Check if prediction includes corrected version of input
      const correctedInput = predWords.slice(0, inputWords.length).join(" ");
      const newWords = predWords.slice(inputWords.length).join(" ");

      // If the correction is very similar to input, use original input
      if (stringSimilarity(text.toLowerCase(), correctedInput) > 0.8) {
        return text + " " + newWords;
      }
      // Otherwise return the full correction
      return prediction;
    }

    return prediction;
  } catch (error) {
    console.error("Error generating prediction:", error);
    return "";
  }
}

// New function to handle chat messages with context
export async function generateChatResponse(
  message: string,
  pageContext: string
): Promise<OpenAIResponse> {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error("OpenAI API key not found");
    }

    // Check rate limit
    if (checkRateLimit()) {
      const waitTime = Math.ceil((RATE_LIMIT.retryAfter - Date.now()) / 1000);
      return {
        text: "",
        error: `Rate limit exceeded. Please try again in ${waitTime} seconds.`,
      };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an AI writing assistant embedded in a browser extension called GhostType AI. " +
              "You help users with their writing tasks based on the context of the webpage they're on. " +
              "Be concise, helpful, and focus on improving the user's writing. " +
              `Here is the context of the current page: ${pageContext}`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      handleApiError(response);
    }

    const data = await response.json();
    return {
      text: data.choices[0].message.content.trim(),
    };
  } catch (error) {
    console.error("Error generating chat response:", error);
    return {
      text: "",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Helper function to check string similarity
function stringSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
    for (let j = 1; j <= len2; j++) {
      if (i === 0) {
        matrix[i][j] = j;
      } else {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
  }

  const maxLen = Math.max(len1, len2);
  const similarity = 1 - matrix[len1][len2] / maxLen;
  return similarity;
}

// New function to handle multi-model chat requests
export async function generateMultiModelResponse(
  message: string,
  pageContext: string,
  model: string
): Promise<OpenAIResponse> {
  try {
    // Get API key based on model type
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error(
        "API key not found. Please add your API key in the extension settings."
      );
    }

    // Check rate limit
    if (checkRateLimit()) {
      const waitTime = Math.ceil((RATE_LIMIT.retryAfter - Date.now()) / 1000);
      return {
        text: "",
        error: `Rate limit exceeded. Please try again in ${waitTime} seconds.`,
      };
    }

    // Map model IDs to actual API model names
    const modelMapping: Record<
      string,
      { endpoint: string; model: string; headers: Record<string, string> }
    > = {
      "gpt-4o-mini": {
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o-mini",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      },
      "gpt-4o": {
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      },
      "claude-3-5-sonnet": {
        endpoint: "https://api.anthropic.com/v1/messages",
        model: "claude-3-5-sonnet",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
      },
      "claude-3-haiku": {
        endpoint: "https://api.anthropic.com/v1/messages",
        model: "claude-3-haiku",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
      },
      // Add more models as needed
    };

    // Get model configuration or use default OpenAI
    const modelConfig = modelMapping[model] || modelMapping["gpt-4o-mini"];

    let response;
    let responseText = "";

    // Handle different API formats
    if (model.startsWith("claude")) {
      // Claude API format
      response = await fetch(modelConfig.endpoint, {
        method: "POST",
        headers: modelConfig.headers,
        body: JSON.stringify({
          model: modelConfig.model,
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content: `Context about the current page: ${pageContext}\n\nUser message: ${message}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        handleApiError(response);
      }

      const data = await response.json();
      responseText = data.content[0].text;
    } else {
      // Default OpenAI format
      response = await fetch(modelConfig.endpoint, {
        method: "POST",
        headers: modelConfig.headers,
        body: JSON.stringify({
          model: modelConfig.model,
          messages: [
            {
              role: "system",
              content:
                "You are an AI writing assistant embedded in a browser extension called GhostType AI. " +
                "You help users with their writing tasks based on the context of the webpage they're on. " +
                "Be concise, helpful, and focus on improving the user's writing. " +
                `Here is the context of the current page: ${pageContext}`,
            },
            {
              role: "user",
              content: message,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        handleApiError(response);
      }

      const data = await response.json();
      responseText = data.choices[0].message.content.trim();
    }

    return {
      text: responseText,
    };
  } catch (error) {
    console.error("Error generating multi-model response:", error);
    return {
      text: "",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Helper function to handle API errors
function handleApiError(response: Response): never {
  // Check for rate limit response
  if (response.status === 429) {
    RATE_LIMIT.isRateLimited = true;
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) {
      RATE_LIMIT.retryAfter = Date.now() + parseInt(retryAfter) * 1000;
    } else {
      RATE_LIMIT.retryAfter = Date.now() + RATE_LIMIT.cooldownPeriod;
    }
    throw new Error("Rate limit exceeded. Please try again later.");
  }

  throw new Error(`API request failed with status ${response.status}`);
}
