# React Dashboard

A modern React dashboard built with Vite, TypeScript, Tailwind CSS, and shadcn/ui.

## Features

-   ⚡️ **Vite** - Fast build tool and dev server
-   ⚛️ **React 18** - Latest React with concurrent features
-   🔷 **TypeScript** - Type safety and better developer experience
-   🎨 **Tailwind CSS** - Utility-first CSS framework
-   🧩 **shadcn/ui** - Beautiful and accessible UI components
-   📱 **Responsive** - Mobile-first design approach

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Available Scripts

-   `npm run dev` - Start development server
-   `npm run build` - Build for production
-   `npm run preview` - Preview production build
-   `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/
│   └── ui/          # shadcn/ui components
├── lib/
│   └── utils.ts     # Utility functions
├── App.tsx          # Main app component
├── main.tsx         # App entry point
└── index.css        # Global styles
```

## Adding shadcn/ui Components

To add new shadcn/ui components, you can use the shadcn/ui CLI:

```bash
npx shadcn-ui@latest add [component-name]
```

## Customization

-   **Colors**: Edit the CSS variables in `src/index.css`
-   **Theme**: Modify `tailwind.config.js` for custom theme settings
-   **Components**: All shadcn/ui components are in `src/components/ui/`

## License

MIT
