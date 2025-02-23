import { defineConfig } from "wxt";
import { defineConfig as defineViteConfig } from "vite";
import * as dotenv from "dotenv";

// Load environment variables
const env = dotenv.config().parsed;

// Debug log for build process
console.log("Environment loaded:", {
  OPENAI_KEY_EXISTS: !!env?.OPENAI_API_KEY,
  ENV_CONTENTS: env,
});

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: "GhostType AI",
    description: "Enhance your writing with AI",
    permissions: ["activeTab", "scripting", "contextMenus"],
    host_permissions: ["<all_urls>", "https://api.openai.com/*"],
    web_accessible_resources: [
      {
        resources: ["icon/*"],
        matches: ["<all_urls>"],
      },
    ],
    icons: {
      "16": "icon/icon.svg",
      "32": "icon/icon.svg",
      "48": "icon/icon.svg",
      "128": "icon/icon.svg",
    },
    action: {
      default_title: "Enhance with AI",
      default_icon: {
        "16": "icon/icon.svg",
        "32": "icon/icon.svg",
        "48": "icon/icon.svg",
        "128": "icon/icon.svg",
      },
    },
    content_security_policy: {
      extension_pages:
        "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
    },
    background: {
      service_worker: "background.js",
      type: "module",
    },
  },
  imports: [
    {
      specifier: "./styles/global.css",
      entrypoints: ["content"],
    },
  ],
  vite: () => ({
    define: {
      __OPENAI_API_KEY__: JSON.stringify(env?.OPENAI_API_KEY || ""),
    },
  }),
  dev: {
    reloadCommand: "Alt+R",
  },
});
