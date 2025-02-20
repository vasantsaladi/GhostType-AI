import { defineContentScript } from "wxt/sandbox";
import { createShadowRootHandler } from "../utils/shadow-dom-handler";

export default defineContentScript({
  // Match all websites
  matches: ["<all_urls>"],

  // Run as soon as possible
  runAt: "document_start",

  // Run in the main world to interact with page scripts
  world: "MAIN",

  main(ctx) {
    import("../content").then(({ textFieldObserver }) => {
      // Start the text field observer
      textFieldObserver.start();
    });
  },
});
