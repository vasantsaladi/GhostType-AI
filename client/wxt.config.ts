import { defineConfig } from "wxt";
import { defineConfig as defineViteConfig } from "vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: "GhostType AI",
    description: "Enhance your writing with Claude AI",
    permissions: ["activeTab", "scripting", "contextMenus"],
    host_permissions: ["<all_urls>", "https://api.anthropic.com/*"],
    web_accessible_resources: [
      {
        resources: ["icon/*"],
        matches: ["<all_urls>"],
      },
    ],
    icons: {
      "16": "icon/16.png",
      "32": "icon/32.png",
      "48": "icon/48.png",
      "128": "icon/128.png",
    },
    action: {
      default_title: "Enhance with AI",
      default_icon: {
        "16": "icon/16.png",
        "32": "icon/32.png",
        "48": "icon/48.png",
        "128": "icon/128.png",
      },
    },
  },
  vite: () =>
    defineViteConfig({
      define: {
        "process.env.CLAUDE_API_KEY": JSON.stringify(
          process.env.CLAUDE_API_KEY
        ),
        "process.env.INBOXSDK_APP_ID": JSON.stringify(
          process.env.INBOXSDK_APP_ID
        ),
      },
    }),
  dev: {
    reloadCommand: "Alt+R",
  },
});
