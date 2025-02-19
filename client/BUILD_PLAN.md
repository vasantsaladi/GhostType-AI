# GhostType-AI Implementation Plan

## Overview

A browser extension that provides AI-powered text completion using Google's Gemini model, similar to GitHub Copilot.

## Implementation Timeline

### Day 1: Core Text Detection Implementation

**File: `src/lib/dom/text-detector.ts`**

```typescript
import { debounce } from "../utils/debounce";

export class TextDetector {
  private observer: MutationObserver;
  private activeTextareas = new WeakSet();

  constructor(
    private callback: (text: string, textarea: HTMLTextAreaElement) => void
  ) {
    this.observer = new MutationObserver(this.handleMutations);
  }

  public start() {
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
    this.scanExistingTextareas();
  }

  private handleMutations = (mutations: MutationRecord[]) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          this.processNode(node as HTMLElement);
        }
      });
    });
  };

  private processNode(node: HTMLElement) {
    if (node instanceof HTMLTextAreaElement) {
      this.attachTextareaHandler(node);
    }
    node
      .querySelectorAll?.("textarea")
      .forEach(this.attachTextareaHandler.bind(this));
  }

  private attachTextareaHandler(textarea: HTMLTextAreaElement) {
    if (this.activeTextareas.has(textarea)) return;
    this.activeTextareas.add(textarea);

    const handler = debounce(async () => {
      this.callback(textarea.value, textarea);
    }, 300);

    textarea.addEventListener("input", handler);
    textarea.addEventListener("scroll", () => this.handleScroll(textarea));
  }
}
```

### Day 2: Ghost Text Component & Positioning

**File: `src/components/GhostText.svelte`**

```svelte
<script lang="ts">
  import { getTextareaMetrics } from '../lib/dom/position';

  export let prediction: string;
  export let target: HTMLTextAreaElement;

  $: metrics = getTextareaMetrics(target);
  $: position = {
    x: target.offsetLeft + target.scrollLeft + metrics.paddingLeft,
    y: target.offsetTop + target.scrollTop + metrics.paddingTop
  };
</script>

{#if prediction}
  <div class="ghost-text" style="left: {position.x}px; top: {position.y}px">
    {prediction}
  </div>
{/if}

<style>
  .ghost-text {
    position: absolute;
    pointer-events: none;
    opacity: 0.4;
    z-index: 2147483647;
    white-space: pre-wrap;
    mix-blend-mode: multiply;
    transition: opacity 0.2s ease;
  }
</style>
```

### Day 3: Gemini Nano Integration

**File: `src/lib/ai/gemini-nano.ts`**

```typescript
interface AITextSession {
  prompt(params: { text: string; maxTokens: number }): Promise<any>;
}

export class GeminiService {
  private static instance: GeminiService;
  private session: AITextSession | null = null;

  private constructor() {
    this.initialize().catch(console.error);
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  private async initialize() {
    if (!window.ai) throw new Error("window.ai not available");
    this.session = await window.ai.createTextSession();
  }

  public async generateCompletion(context: string): Promise<string> {
    if (!this.session) await this.initialize();
    try {
      const result = await this.session!.prompt({
        text: `Complete this text: ${context.slice(-512)}`,
        maxTokens: 64,
      });
      return result.text;
    } catch (error) {
      console.error("Inference error:", error);
      return "";
    }
  }
}
```

### Day 4: State Management & Caching

**File: `src/lib/stores/predictions.ts`**

```typescript
import { writable } from "svelte/store";

export const predictionStore = writable({
  current: "",
  isLoading: false,
  error: null,
});
```

**File: `src/lib/utils/context.ts`**

```typescript
export class ContextCache {
  private cache = new Map<string, string>();
  private maxSize = 100;

  getContext(text: string): string {
    const key = this.hash(text);
    const cached = this.cache.get(key);
    if (cached) return cached;

    const context = text.slice(-512);
    this.cache.set(key, context);
    if (this.cache.size > this.maxSize) {
      this.cache.delete(this.cache.keys().next().value);
    }
    return context;
  }

  private hash(text: string): string {
    return text
      .split("")
      .reduce((a, b) => Math.imul(31, a) + b.charCodeAt(0), 0)
      .toString(36);
  }
}
```

### Day 5: Content Script Integration

**File: `src/entrypoints/content.ts`**

```typescript
import { TextDetector } from "../lib/dom/text-detector";
import { GeminiService } from "../lib/ai/gemini-nano";
import { predictionStore } from "../lib/stores/predictions";
import GhostText from "../components/GhostText.svelte";

const gemini = GeminiService.getInstance();
const detector = new TextDetector(async (text, textarea) => {
  predictionStore.update((s) => ({ ...s, isLoading: true }));

  try {
    const completion = await gemini.generateCompletion(text);
    new GhostText({
      target: document.body,
      props: { prediction: completion, target: textarea },
    });
  } catch (error) {
    predictionStore.update((s) => ({ ...s, error: error.message }));
  } finally {
    predictionStore.update((s) => ({ ...s, isLoading: false }));
  }
});

detector.start();
```

## Performance Optimization

**File: `src/lib/dom/position.ts`**

```typescript
export function getTextareaMetrics(textarea: HTMLTextAreaElement) {
  const style = getComputedStyle(textarea);
  return {
    fontSize: style.fontSize,
    fontFamily: style.fontFamily,
    lineHeight: style.lineHeight,
    paddingLeft: parseFloat(style.paddingLeft),
    paddingTop: parseFloat(style.paddingTop),
  };
}
```

## WXT Configuration

**File: `wxt.config.ts`**

```typescript
export default defineConfig({
  manifest: {
    name: "GhostTypeAI",
    permissions: ["activeTab"],
    host_permissions: ["<all_urls>"],
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval';",
    },
  },
  modules: ["@wxt/svelte"],
  vite: {
    build: {
      target: "esnext",
    },
  },
});
```

## Implementation Checklist

### 1. Text Detection Validation

```bash
# Test in Chrome with various textareas
chrome --enable-benchmarking --enable-logging=stderr
```

### 2. Performance Monitoring

```javascript
// Add to content.ts
console.time("FirstPrediction");
// After first prediction
console.timeEnd("FirstPrediction");
```

### 3. Cross-Browser Testing

```typescript
// wxt.config.ts
export default defineConfig({
  // ... other config
  outDir: "dist",
  runner: {
    chromium: true,
    firefox: false, // Enable post-MVP
    safari: false,
  },
});
```

## Architecture Highlights

1. **WeakSet** for tracking active textareas (prevents memory leaks)
2. **Singleton Pattern** for Gemini service (single session reuse)
3. **Svelte Reactivity** for efficient DOM updates
4. **LRU Caching** for frequent text contexts
5. **Debounced Input Handling** for optimal API usage

## Performance Metrics

| Metric              | Target     | Measurement Method             |
| ------------------- | ---------- | ------------------------------ |
| Text Detection Time | <50ms/page | Chrome Performance Panel       |
| Prediction Latency  | <500ms     | console.time measurements      |
| Memory Usage        | <50MB      | Chrome Memory Profiler         |
| Textarea Coverage   | 95%        | Test Matrix (Gmail, Docs, CMS) |
