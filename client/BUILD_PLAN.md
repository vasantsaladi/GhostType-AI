# 24-Hour MVP Implementation Roadmap

## 1. Core Architecture (3 hours)

**Tech Stack:**

- **WXT Framework** (Faster than Vite+React)
- **TypeScript** (Existing Codebase)
- **Shadow DOM** for UI isolation
- **Chrome MV3** (No React DevTools Needed)

```bash
# Initialize project
npx wxt@latest init --template react-ts
```

## 2. Essential Text Field Handling (4 hours)

**Key Improvements:**

- Combined MutationObserver + Event Delegation
- Supports ContentEditable + Shadow DOM inputs

```typescript
// content.ts
const observer = new MutationObserver((mutations) => {
  document
    .querySelectorAll('input, textarea, [contenteditable="true"]')
    .forEach(attachHandler);
});

observer.observe(document, {
  subtree: true,
  childList: true,
  attributes: true,
});
```

## 3. Gemini Nano Integration (4 hours)

**Optimizations:**

- Direct `window.ai` API access
- Model pre-loading during idle

```typescript
// background.ts
let aiSession: AISession;

chrome.runtime.onStartup.addListener(async () => {
  aiSession = await window.ai.createTextSession({
    model: "gemini-nano",
    quantization: "int4",
  });
});

chrome.runtime.onMessage.addListener((req, _, res) => {
  aiSession.prompt(req.text.slice(-200)).then((completion) => res(completion));
  return true;
});
```

## 4. Zero-Latency UI (3 hours)

**Critical Features:**

- CSS Font Matching Algorithm
- Position Synchronization System

```typescript
// overlay.ts
function syncStyles(source: Element, overlay: HTMLElement) {
  const style = getComputedStyle(source);
  overlay.style.cssText = `
    font: ${style.font};
    letter-spacing: ${style.letterSpacing};
    line-height: ${style.lineHeight};
    z-index: 2147483647;
  `;
}
```

## 5. Edge Case Handling (4 hours)

**Solutions:**

- **Undo/Redo:** Document.execCommand()
- **Scrolling:** IntersectionObserver + ResizeObserver
- **Mobile:** Virtual Keyboard Detection

```typescript
// undo-manager.ts
let lastValue = "";
const observer = new MutationObserver(() => {
  if (target.value !== lastValue) {
    undoStack.push(lastValue);
    lastValue = target.value;
  }
});
```

## 6. Performance Optimization (3 hours)

**Techniques:**

- Debounced Predictions (300ms)
- Prediction Cache (LRU Strategy)
- WebAssembly Accelerated Tokenization

```typescript
const predictionCache = new Map<string, string>();

function getCachedCompletion(text: string) {
  if (predictionCache.has(text)) {
    return predictionCache.get(text);
  }
  // ...
}
```

## 7. Cross-Site Testing (3 hours)

**Validation Matrix:**

| Site Type       | Test Cases            |
| :-------------- | :-------------------- |
| CMS (WordPress) | TinyMCE, Gutenberg    |
| SPAs (React)    | Controlled Components |
| Email Clients   | Gmail, Outlook        |

## 8. Demo Preparation (Final 3 hours)

**Key Demo Points:**

1. Live Typing in Google Docs
2. Form Field Completion (React Hook Form)
3. Undo/Redo Showcase
4. Cross-site Consistency

**Critical Path Visualization:**

```
[Typing] → [Debounce] → [AI Call] → [Cache Check] → [UI Render]
           (300ms)      (150-200ms)   (0-50ms)      (16ms)
```

This plan leverages the most efficient patterns from search results while maintaining your existing TypeScript/WXT foundation. The focused approach eliminates non-essential features while implementing robust text handling through:

1. **MutationObserver** + **Event Delegation** hybrid monitoring
2. **Font Synchronization** through computed style analysis
3. **Prediction Cache** with LRU expiration
4. **Cross-frame** support via Shadow DOM isolation

Total Implementation Time: 24 hours

<div style="text-align: center">⁂</div>
