# HTML Text Editor with Live Preview

A feature-rich HTML editor built with Next.js that allows you to write HTML code and see the live preview in real-time.

## Features

- Modern code editor with syntax highlighting (using Monaco Editor)
- Live preview of HTML as you type
- Copy HTML to clipboard
- Download HTML file
- Markdown editor with LaTeX and Mermaid diagram support
- Node.js playground with simulated environment
- Offline capability (works without internet connection)
- Installable on desktop and mobile devices (PWA)
- Responsive design that works on both desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 16.8.0 or newer

### Installation

1. Clone this repository
```bash
git clone https://github.com/yourusername/html-text-editor.git
cd html-text-editor
```

2. Install dependencies
```bash
npm install
```

3. Run the development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Deploying for Production

To build the application for production:

```bash
npm run build
npm start
```

## Using the App Offline

This application is a Progressive Web App (PWA), which means:

1. It can be installed on your device (desktop or mobile)
2. It works offline after the first load
3. It loads faster on subsequent visits

### Installing on Desktop or Mobile

1. Open the application in a supported browser (Chrome, Edge, Safari)
2. Look for the install option in your browser:
   - Desktop: Click the install icon in the address bar
   - Mobile: Select "Add to Home Screen" from the browser menu

### Custom App Icons

To replace the default PWA icons with your own:

1. Create your own icons (192x192 and 512x512 pixels)
2. Replace the files in `/public/icons/` directory
3. See `ICON_INSTRUCTIONS.md` for detailed guidance

## Usage

1. Write HTML code in the editor on the left side
2. See the live preview on the right side
3. Use the "Copy HTML" button to copy the HTML code to clipboard
4. Use the "Download HTML" button to download the HTML as a file

## Built With

- [Next.js](https://nextjs.org/) - The React framework
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Marked](https://marked.js.org/) - Markdown parser
- [KaTeX](https://katex.org/) - LaTeX rendering
- [Mermaid](https://mermaid.js.org/) - Diagram rendering
- [Next-PWA](https://github.com/shadowwalker/next-pwa) - PWA plugin for Next.js

## License

This project is licensed under the MIT License
