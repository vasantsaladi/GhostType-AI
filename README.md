# GhostType AI

GhostType AI is a Chrome extension that enhances your writing experience with AI assistance. It provides smart text predictions, text enhancement, and multi-model AI chat capabilities.

## Features

- **Multi-Model AI Chat**: Chat with various AI models including OpenAI (GPT-4o, GPT-4o-mini), Anthropic (Claude 3.5 Sonnet, Claude 3 Haiku), Google (Gemini), and more.
- **Smart Text Predictions**: Get real-time suggestions as you type, helping you write faster and more efficiently.
- **Text Enhancement**: Improve your writing with AI-powered text enhancement that makes your content more professional and engaging.
- **Context-Aware Assistance**: The extension understands the context of the page you're on, providing more relevant assistance.

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/ghosttype-ai.git
   cd ghosttype-ai
   ```

2. Install dependencies:

   ```
   cd client
   npm install
   ```

3. Build the extension:

   ```
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top-right corner
   - Click "Load unpacked" and select the `dist` directory from the project

## Usage

- Press `Alt+G` to toggle the sidebar
- Press `Alt+M` to toggle the multi-model chat
- Configure your API keys in the extension options
- Right-click on text to enhance it with GhostType AI

## API Keys

To use all features, you'll need to provide API keys for the AI services you want to use:

- OpenAI API key for GPT models
- Anthropic API key for Claude models
- Google API key for Gemini models

Add these in the extension options page.

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

### Setup

1. Install dependencies:

   ```
   cd client
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

## Project Structure

- `client/components/`: React components for the UI
- `client/services/`: Services for API interactions
- `client/entrypoints/`: Entry points for different parts of the extension
- `client/utils/`: Utility functions

## Recent Updates

- Code cleanup and optimization
- Removed unused files and dependencies
- Consolidated error handling in API services
- Updated package dependencies

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [WXT](https://wxt.dev/) - Web Extension Toolkit
- [OpenAI](https://openai.com/)
- [Anthropic](https://www.anthropic.com/)
- [Google](https://ai.google.dev/)
