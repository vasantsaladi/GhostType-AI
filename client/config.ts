const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key] || defaultValue;
  if (!value) {
    console.error(
      `Environment variable ${key} is not set. Please check your .env file.`
    );
  }
  return value || "";
};

// API Keys and Configuration
export const CLAUDE_API_KEY = getEnvVar("CLAUDE_API_KEY");
if (!CLAUDE_API_KEY) {
  throw new Error(
    "CLAUDE_API_KEY is required. Please add it to your .env file."
  );
}

export const INBOXSDK_APP_ID = getEnvVar(
  "INBOXSDK_APP_ID",
  "sdk_GhostType_AI_v1"
);
