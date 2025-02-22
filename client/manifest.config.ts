import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "GhostType AI",
  description: "AI-powered text completion for any text field",
  version: "1.0.0",
  permissions: ["activeTab", "scripting", "storage"],
  host_permissions: ["<all_urls>"],
  background: {
    service_worker: "background.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["content.ts"],
      all_frames: true,
      run_at: "document_start",
    },
  ],
  action: {
    default_popup: "popup/index.html",
  },
});
