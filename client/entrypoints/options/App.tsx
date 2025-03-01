import React, { useState, useEffect } from "react";

interface ApiKeys {
  openai: string;
  anthropic: string;
  google: string;
  deepseek: string;
}

export default function OptionsApp() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    openai: "",
    anthropic: "",
    google: "",
    deepseek: "",
  });
  const [maxRequestsPerMinute, setMaxRequestsPerMinute] = useState<number>(20);
  const [status, setStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("api-keys");

  useEffect(() => {
    // Load settings from storage
    chrome.storage.sync.get(
      [
        "openaiApiKey",
        "anthropicApiKey",
        "googleApiKey",
        "deepseekApiKey",
        "maxRequestsPerMinute",
      ],
      (result) => {
        setApiKeys({
          openai: result.openaiApiKey || "",
          anthropic: result.anthropicApiKey || "",
          google: result.googleApiKey || "",
          deepseek: result.deepseekApiKey || "",
        });
        setMaxRequestsPerMinute(result.maxRequestsPerMinute || 20);
      }
    );
  }, []);

  const saveSettings = async () => {
    setStatus("Saving...");
    try {
      await chrome.storage.sync.set({
        openaiApiKey: apiKeys.openai,
        anthropicApiKey: apiKeys.anthropic,
        googleApiKey: apiKeys.google,
        deepseekApiKey: apiKeys.deepseek,
        maxRequestsPerMinute,
      });
      setStatus("Settings saved successfully!");
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setStatus("Error saving settings. Please try again.");
    }
  };

  const handleApiKeyChange = (provider: keyof ApiKeys, value: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [provider]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-blue-600">
            <h1 className="text-xl font-bold text-white">
              GhostType AI Settings
            </h1>
          </div>

          <div className="p-6">
            <div className="mb-6 border-b border-gray-200">
              <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                <li className="mr-2">
                  <button
                    className={`inline-block p-4 border-b-2 rounded-t-lg ${
                      activeTab === "api-keys"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent hover:text-gray-600 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveTab("api-keys")}
                  >
                    API Keys
                  </button>
                </li>
                <li className="mr-2">
                  <button
                    className={`inline-block p-4 border-b-2 rounded-t-lg ${
                      activeTab === "rate-limits"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent hover:text-gray-600 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveTab("rate-limits")}
                  >
                    Rate Limits
                  </button>
                </li>
                <li className="mr-2">
                  <button
                    className={`inline-block p-4 border-b-2 rounded-t-lg ${
                      activeTab === "about"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent hover:text-gray-600 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveTab("about")}
                  >
                    About
                  </button>
                </li>
              </ul>
            </div>

            {activeTab === "api-keys" && (
              <div>
                <p className="mb-4 text-gray-600">
                  Enter your API keys for the AI services you want to use. You
                  can leave fields blank for services you don't plan to use.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      OpenAI API Key (for GPT models)
                    </label>
                    <input
                      type="password"
                      value={apiKeys.openai}
                      onChange={(e) =>
                        handleApiKeyChange("openai", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="sk-..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Used for GPT-4o, GPT-4o mini, and other OpenAI models
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Anthropic API Key (for Claude models)
                    </label>
                    <input
                      type="password"
                      value={apiKeys.anthropic}
                      onChange={(e) =>
                        handleApiKeyChange("anthropic", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="sk-ant-..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Used for Claude 3.5 Sonnet, Claude 3 Haiku, and other
                      Claude models
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Google API Key (for Gemini models)
                    </label>
                    <input
                      type="password"
                      value={apiKeys.google}
                      onChange={(e) =>
                        handleApiKeyChange("google", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="AIza..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Used for Gemini 1.5 Pro and other Google AI models
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DeepSeek API Key
                    </label>
                    <input
                      type="password"
                      value={apiKeys.deepseek}
                      onChange={(e) =>
                        handleApiKeyChange("deepseek", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="sk-..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Used for DeepSeek models
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "rate-limits" && (
              <div>
                <p className="mb-4 text-gray-600">
                  Configure rate limiting to prevent excessive API usage and
                  costs.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Requests Per Minute
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={maxRequestsPerMinute}
                    onChange={(e) =>
                      setMaxRequestsPerMinute(parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Limit the number of API requests per minute to control costs
                  </p>
                </div>
              </div>
            )}

            {activeTab === "about" && (
              <div className="prose prose-blue max-w-none">
                <h2 className="text-lg font-semibold mb-2">
                  About GhostType AI
                </h2>
                <p>
                  GhostType AI is a powerful browser extension that enhances
                  your writing experience with AI assistance.
                </p>

                <h3 className="text-md font-semibold mt-4 mb-2">Features</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Multi-model AI chat with support for OpenAI, Claude, Gemini,
                    and more
                  </li>
                  <li>Smart text predictions as you type</li>
                  <li>Text enhancement for improving your writing</li>
                  <li>
                    Context-aware AI assistance that understands the page you're
                    on
                  </li>
                  <li>
                    Group chat to compare responses from different AI models
                  </li>
                </ul>

                <h3 className="text-md font-semibold mt-4 mb-2">Privacy</h3>
                <p>
                  GhostType AI respects your privacy. Your data is processed
                  locally and only sent to AI providers when you explicitly
                  request assistance. We do not store your API keys on our
                  servers - they are saved in your browser's local storage.
                </p>

                <h3 className="text-md font-semibold mt-4 mb-2">Support</h3>
                <p>
                  For support or feature requests, please visit our GitHub
                  repository or contact us at support@ghosttype.ai
                </p>

                <p className="text-sm text-gray-500 mt-4">Version 1.0.0</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={saveSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save Settings
              </button>

              {status && (
                <span
                  className={`text-sm ${
                    status.includes("Error") ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {status}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
