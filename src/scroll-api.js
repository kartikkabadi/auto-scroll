import { createScrollController } from "./lib/scroll.js";

if (typeof window !== "undefined") {
  if (!window.__autoScrollExtAPI) {
    window.__autoScrollExtAPI = createScrollController(window, document);
  }
}
