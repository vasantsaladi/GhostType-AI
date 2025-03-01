# GhostType AI Chrome Extension

GhostType AI enhances your writing with AI-powered suggestions directly in your browser.

## Features

- Real-time ghost text suggestions as you type
- Context-aware AI assistance
- Sidebar chat for more detailed help
- Text enhancement for selected content
- Works across popular platforms and websites

## Development

### Prerequisites

- Node.js 16+
- pnpm

### Setup

1. Clone the repository
2. Create a `.env` file based on `.env.example`
3. Install dependencies:

```bash
pnpm install
```

### Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Create distribution zip
pnpm zip
```

### Keyboard Shortcuts

- **Command+G** (Mac) / **Alt+G** (Windows/Linux): Toggle sidebar
- **Tab**: Accept ghost text suggestion

## Installation

1. Build the extension with `pnpm build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `.output/chrome-mv3` directory

## License

MIT
