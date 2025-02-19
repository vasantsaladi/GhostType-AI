# GhostType AI - 24-Hour Build Plan

## Hour-by-Hour Implementation Guide

### Hours 0-2: Project Setup

```bash
# Install core tools
npm install -g wxt typescript

# Initialize project
npm create wxt@latest -- -t react-ts

# Install minimal dependencies
npm install @radix-ui/react-slot clsx tailwind-merge lodash.debounce @types/chrome
```

### Hours 2-4: Input Detection System

```typescript
// src/content.ts
const INPUT_SELECTORS = [
  "textarea",
  'input[type="text"]',
  'div[contenteditable="true"]',
];

const trackActiveInput = (): HTMLElement | null => {
  const activeEl = document.activeElement as HTMLElement;
  return INPUT_SELECTORS.some((selector) => activeEl?.matches(selector))
    ? activeEl
    : null;
};

// Simple mutation observer setup
new MutationObserver(() => {
  const input = trackActiveInput();
  if (input) handleInputDetected(input);
}).observe(document.body, { subtree: true, childList: true });
```

### Hours 4-8: Ghost Text Component

```tsx
// src/components/GhostText.tsx
const GhostText = ({ suggestion, target }: Props) => {
  const [position, setPosition] = useState(target.getBoundingClientRect());

  useLayoutEffect(() => {
    const updatePosition = () => setPosition(target.getBoundingClientRect());
    const observer = new ResizeObserver(updatePosition);
    observer.observe(target);
    return () => observer.disconnect();
  }, [target]);

  return createPortal(
    <div
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        opacity: 0.6,
        pointerEvents: "none",
        font: window.getComputedStyle(target).font,
      }}
    >
      {suggestion}
    </div>,
    document.body
  );
};
```

### Hours 8-12: Gemini Nano Integration

```typescript
// src/services/ai.ts
const getCompletion = async (context: string): Promise<string> => {
  try {
    if (!window.ai?.languageModel) {
      throw new Error("Gemini Nano not available");
    }

    const session = await window.ai.languageModel.createSession();
    return session.prompt(context.slice(-500));
  } catch (error) {
    console.error("AI Error:", error);
    return ""; // Silent fail for MVP
  }
};

// Debounced wrapper
export const useDebouncedAI = (delay = 300) => {
  return useCallback(
    debounce(async (text: string) => getCompletion(text), delay),
    []
  );
};
```

### Hours 12-16: Tab Completion Handler

```typescript
// src/handlers/completion.ts
const handleTabCompletion = (e: KeyboardEvent, suggestion: string) => {
  if (e.key === "Tab" && suggestion) {
    e.preventDefault();
    const input = e.target as HTMLElement;
    document.execCommand("insertText", false, suggestion);
  }
};

export const useTabCompletion = (suggestion: string) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => handleTabCompletion(e, suggestion);
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [suggestion]);
};
```

### Hours 16-20: Main Integration

```tsx
// src/Content.tsx
const Content = () => {
  const [input, setInput] = useState<HTMLElement | null>(null);
  const [suggestion, setSuggestion] = useState("");
  const getAICompletion = useDebouncedAI();

  useEffect(() => {
    const checkInput = () => {
      const detected = trackActiveInput();
      if (detected !== input) {
        setInput(detected);
      }
    };

    const interval = setInterval(checkInput, 500);
    return () => clearInterval(interval);
  }, [input]);

  useEffect(() => {
    if (input) {
      const text = input.value || input.textContent || "";
      getAICompletion(text).then(setSuggestion);
    }
  }, [input, getAICompletion]);

  useTabCompletion(suggestion);

  return input && suggestion ? (
    <GhostText suggestion={suggestion} target={input} />
  ) : null;
};
```

### Hours 20-24: Testing & Performance

```typescript
// Critical test cases
const testCases = [
  "Gmail Compose",
  "Google Docs",
  "Twitter",
  "Basic Textarea",
  "Dynamic Inputs",
];

// Performance metrics
const metrics = {
  inputLatency: "< 50ms",
  aiResponse: "< 150ms",
  renderTime: "< 50ms",
  memoryUsage: "< 50MB",
};
```

## Emergency Fallbacks

1. Font matching issues: Use system default
2. Position sync issues: Force recalc on scroll
3. AI unavailable: Show loading state

## Final Build & Deploy

```bash
# Production build
npm run build

# Package extension
cd dist && zip -r ../ghosttype.zip .
```

## Success Criteria

- [x] Works on Chrome latest
- [x] < 200ms total latency
- [x] Basic completion working
- [x] Tab to accept
- [x] Graceful error handling
