import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: import.meta.env.CLAUDE_API_KEY as string,
});

export const generateImprovedEmail = async (
  originalText: string
): Promise<string> => {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Please improve this email to make it more professional and effective, while maintaining its core message and tone:

${originalText.replace(/<[^>]*>/g, "")}`,
        },
      ],
    });

    // Handle the response content safely
    const content = response.content[0];
    if ("type" in content && content.type === "text") {
      return content.text;
    }
    return "Failed to get enhanced version. Please try again.";
  } catch (error) {
    console.error("Error generating improved email:", error);
    return "Failed to generate improved version. Please try again.";
  }
};
