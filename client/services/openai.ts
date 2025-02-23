declare const __OPENAI_API_KEY__: string;

export interface OpenAIResponse {
  text: string;
  error?: string;
}

export async function generateImprovedText(
  originalText: string
): Promise<OpenAIResponse> {
  try {
    console.log("Attempting to call OpenAI API...");
    if (!__OPENAI_API_KEY__) {
      throw new Error(
        "OpenAI API key not found. Please check your .env file and rebuild the extension."
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${__OPENAI_API_KEY__}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a professional writing assistant. Improve the given text while maintaining its core message and intent. Make it more professional, clear, and engaging.",
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
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
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
    if (!__OPENAI_API_KEY__) {
      throw new Error("OpenAI API key not found");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${__OPENAI_API_KEY__}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful text prediction assistant. Complete the user's text naturally and concisely.",
          },
          {
            role: "user",
            content: `Complete this text naturally: "${text}"`,
          },
        ],
        temperature: 0.4,
        max_tokens: 50,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get prediction");
    }

    const data = await response.json();
    const prediction = data.choices[0].message.content.trim();

    // Only return the prediction if it's a natural continuation
    if (prediction.toLowerCase().startsWith(text.toLowerCase())) {
      return prediction;
    }
    return text + prediction;
  } catch (error) {
    console.error("Error generating prediction:", error);
    return "";
  }
}
