import { defineConfig } from "wxt";
import fs from "fs/promises";

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  srcDir: "src",
  manifest: {
    name: "GhostTypeAI",
    version: "0.1",
    permissions: ["activeTab", "storage", "ai"],
    host_permissions: ["<all_urls>"],
    web_accessible_resources: [
      {
        resources: ["wasm/*.wasm", "styles/*.css"],
        matches: ["<all_urls>"],
      },
    ],
  },
  hooks: {
    // Correct the hook configuration if necessary
    // Example: use a valid hook name or remove if not supported
  },
});
