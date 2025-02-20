import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  srcDir: "src",

  // Manifest configuration
  manifest: ({ manifestVersion }) => ({
    // Basic extension metadata
    name: "GhostType AI",
    description: "AI-powered text completion and assistance",

    // Permissions needed for our MVP
    permissions: [
      // Storage for caching and settings
      "storage",

      // Optional: tabs permission for potential future features
      "tabs",
    ],

    // Host permissions to ensure our content script works everywhere
    host_permissions: ["<all_urls>"],

    // Action configuration (browser icon behavior)
    action: {
      default_title: "GhostType AI",
      // WXT will automatically use icons from public/ directory
    },

    // Web accessible resources (if needed for future features)
    web_accessible_resources:
      manifestVersion === 3
        ? [
            {
              matches: ["<all_urls>"],
              resources: ["content-scripts/*.js", "content-scripts/*.css"],
            },
          ]
        : undefined,
  }),
});
