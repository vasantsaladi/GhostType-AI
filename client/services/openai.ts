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
              "You are a natural text predictor. Continue the user's text naturally, fixing any typos in their input if needed. Keep suggestions brief (2-3 words) and conversational. Never use quotation marks.",
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
      throw new Error("Failed to get prediction");
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
