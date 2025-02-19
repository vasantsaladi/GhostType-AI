# GhostType AI - System Architecture

## System Overview

```mermaid
graph TD
    A[User Input] --> B[Input Detector]
    B --> C[AI Service]
    C --> D[Ghost Text UI]
    D --> E[Tab Completion]

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#dfd,stroke:#333,stroke-width:2px
    style D fill:#fdd,stroke:#333,stroke-width:2px
    style E fill:#dff,stroke:#333,stroke-width:2px
```

## Component Architecture

```mermaid
graph LR
    subgraph Content Script
        A[Input Detector] --> B[Ghost Text]
        B --> C[Position Engine]
    end

    subgraph AI Layer
        D[Gemini Nano] --> E[Text Generation]
        E --> F[Error Fallback]
    end

    subgraph UI Layer
        G[React Portal] --> H[Shadow DOM]
        H --> I[Style Sync]
    end

    Content Script --> AI Layer
    AI Layer --> UI Layer
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Input
    participant AI
    participant UI

    User->>Input: Type text
    Input->>AI: Request completion
    AI-->>UI: Return suggestion
    User->>Input: Press Tab
    Input->>User: Accept completion
```

## State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Detecting: Focus Input
    Detecting --> Processing: Text Change
    Processing --> Displaying: AI Response
    Displaying --> Idle: Tab/Escape
    Displaying --> Processing: New Input
    Processing --> Error: AI Failure
    Error --> Idle: Reset
```

## Critical Paths

```mermaid
graph TD
    A[Input Event] -->|300ms Debounce| B[Text Processing]
    B -->|100ms Max| C[AI Request]
    C -->|50ms Max| D[UI Update]
    D -->|Instant| E[Ghost Text]

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#dfd,stroke:#333,stroke-width:2px
    style D fill:#fdd,stroke:#333,stroke-width:2px
    style E fill:#dff,stroke:#333,stroke-width:2px
```

## Performance Targets

```mermaid
graph LR
    subgraph Latency Budgets
        A[Input: 50ms] --> B[AI: 150ms]
        B --> C[Render: 50ms]
    end

    subgraph Resource Limits
        D[Memory: 50MB] --> E[CPU: 1%]
        E --> F[Storage: 10MB]
    end
```

## Error Handling

```mermaid
flowchart TD
    A[Error Detected] --> B{Error Type}
    B -->|AI Unavailable| C[Cloud Fallback]
    B -->|Network Error| D[Local Cache]
    B -->|Position Error| E[Force Recalc]
    C --> F[Resume]
    D --> F
    E --> F
```

## MVP Scope

```mermaid
pie
    title Feature Priority
    "Input Detection" : 30
    "AI Integration" : 25
    "Ghost Text UI" : 20
    "Tab Completion" : 15
    "Error Handling" : 10
```

## Core Components

### 1. Content Script Layer (Essential)

```typescript
interface InputDetector {
  activeElement: HTMLElement | null;
  inputSelectors: string[];

  initialize(): void;
  cleanup(): void;
  handleInputChange(element: HTMLElement): void;
}
```

Key MVP features:

- Basic DOM monitoring for text inputs
- Input element detection
- Cursor position tracking

### 2. UI Layer (Minimal)

```typescript
interface GhostTextProps {
  suggestion: string;
  position: {
    top: number;
    left: number;
  };
  style: {
    font: string;
    color: string;
  };
}
```

MVP features:

- Basic text overlay positioning
- Font matching
- Simple portal-based rendering

### 3. AI Integration (Core)

```typescript
interface AIService {
  model: "gemini-nano";
  generateCompletion(context: string): Promise<string>;
}
```

MVP features:

- Basic Gemini Nano integration
- Simple text completion
- Error fallback to cloud API

## Performance (MVP Focus)

### 1. Basic Debouncing

```typescript
const debouncedUpdate = debounce((text: string) => {
  requestCompletion(text);
}, 300);
```

### 2. Simple Context

```typescript
const getContext = (element: HTMLElement): string => {
  const text = element.value || element.textContent;
  const cursorPos = getCursorPosition(element);
  return text.substring(Math.max(0, cursorPos - 100), cursorPos);
};
```

## MVP Browser Support

- Chrome only (initial release)
- Basic textarea and input[type="text"] support
- Simple undo/redo via browser native support

## Security (Essential Only)

- Input sanitization
- Basic CSP compliance
- Local processing preference

## Error Handling (MVP)

```typescript
const handleError = async (error: Error) => {
  console.error(error);
  fallbackToCloud();
};
```

## Future Considerations (Post-MVP)

- Cross-browser support
- Advanced text positioning
- Caching system
- Plugin system
- Custom models
- Advanced UI components with shadcn/ui
