
import  packageLock from "../constants/fallback/package-lock.json";

export function buildFilesForSandpack(code: string) {
  // Estructura tipo Vite: /index.html + /src/main.tsx + /src/App.tsx + Tailwind por PostCSS
  const appFile = "/src/App.tsx";
  // const indexFile = "/src/main.tsx";

  //   [indexFile]: {
  //     code: `import React from 'react';
  // import ReactDOM from 'react-dom/client';
  // import App from './App.tsx';
  // import './index.css';

  // ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
  //     <App />
  // </React.StrictMode>
  // );
  // `,
  //   },
  // "/src/index.css": {
  //   code: `/* Fallback solo para Sandpack: hoja compilada de Tailwind v3 (sin tocar index.html) */
  // @import url("https://cdn.jsdelivr.net/npm/tailwindcss@3.4.3/dist/tailwind.min.css");

  // @tailwind base;
  // @tailwind components;
  // @tailwind utilities;

  // html, body, #root { height: 100%; }
  // body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, sans-serif; }`,
  // },
  // "/postcss.config.js": {
  //   code: `export default {
  // plugins: {
  // tailwindcss: {},
  // autoprefixer: {},
  // },
  // }`,
  // },
  const files: Record<string, { code: string }> = {
    [appFile]: { code },
    "/postcss.config.js": {
      code: `export default {
plugins: {
tailwindcss: {},
autoprefixer: {},
},
}`,
    },
    "/index.html": {
      code: `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React Stays - MVP</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
    },
    "/tailwind.config.ts": {
      code: `import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
      },
      borderRadius: {
        lg: '0.5rem',
        md: 'calc(0.5rem - 2px)',
        sm: 'calc(0.5rem - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
}

export default config`,
    },
    "/tsconfig.json": {
      code: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2020",
            useDefineForClassFields: true,
            lib: ["ES2020", "DOM", "DOM.Iterable"],
            module: "ESNext",
            skipLibCheck: true,
            /* Bundler mode */
            moduleResolution: "bundler",
            allowImportingTsExtensions: true,
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: "react-jsx",
            /* Linting */
            strict: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            noFallthroughCasesInSwitch: true,
            /* Aliases */
            baseUrl: ".",
            paths: {
              "@/*": ["src/*"],
            },
          },
          include: ["src"],
          references: [{ path: "./tsconfig.node.json" }],
        },
        null,
        2
      ),
    },
    "/tsconfig.node.json": {
      code: JSON.stringify(
        {
          compilerOptions: {
            composite: true,
            skipLibCheck: true,
            module: "ESNext",
            moduleResolution: "bundler",
            allowSyntheticDefaultImports: true,
            strict: true,
            types: ["node"],
          },
          include: ["vite.config.ts"],
        },
        null,
        2
      ),
    },
    "/package.json": {
      code: JSON.stringify(
        {
          name: "react-airbnb-clone-mvp",
          private: true,
          version: "0.0.0",
          type: "module",
          scripts: {
            dev: "vite",
            build: "tsc && vite build",
            lint: "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
            preview: "vite preview",
          },
          dependencies: {
            clsx: "^2.1.1",
            "lucide-react": "^0.379.0",
            react: "^18.2.0",
            "react-dom": "^18.2.0",
            "react-router-dom": "^6.23.1",
            "tailwind-merge": "^2.3.0",
          },
          devDependencies: {
            "@types/node": "^24.2.1",
            "@types/react": "^18.2.66",
            "@types/react-dom": "^18.2.22",
            "@typescript-eslint/eslint-plugin": "^7.2.0",
            "@typescript-eslint/parser": "^7.2.0",
            "@vitejs/plugin-react": "^4.2.1",
            autoprefixer: "^10.4.19",
            eslint: "^8.57.0",
            "eslint-plugin-react-hooks": "^4.6.0",
            "eslint-plugin-react-refresh": "^0.4.6",
            postcss: "^8.4.38",
            prettier: "^3.2.5",
            "prettier-plugin-tailwindcss": "^0.5.14",
            tailwindcss: "^3.4.3",
            typescript: "^5.2.2",
            vite: "^5.2.0",
          },
        },
        null,
        2
      ),
    },
    "/vite.config.ts": {
      code: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})`,
    },
    "/.prettierrc": {
      code: `{
  "semi": false,
  "tabWidth": 2,
  "singleQuote": true,
  "trailingComma": "all",
  "plugins": ["prettier-plugin-tailwindcss"]
}`,
    },
    "/.eslintrc.cjs": {
      code: `module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
  },
}`,
    },
    "/.gitignore": {
      code: `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*


# Runtime data
pids
*.pid
*.seed
*.pid.lock


# Coverage directory used by tools like istanbul
coverage
*.lcov


# nyc test coverage
.nyc_output


# Dependency directories
node_modules/
jspm_packages/


# Optional npm cache directory
.npm


# Optional eslint cache
.eslintcache


# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/


# Optional REPL history
.node_repl_history


# Output of 'npm pack'
*.tgz


# Yarn Integrity file
.yarn-integrity


# dotenv environment variables file
.env
.env.local
.env.development.local
.env.test.local
.env.production.local


# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache


# Next.js build output
.next
out


# Nuxt.js build / generate output
.nuxt
dist


# Gatsby files
.cache/
public


# Vite build output
dist-ssr
*.local


# Rollup.js default build output
dist/


# Serverless directories
.serverless/


# FuseBox cache
.fusebox/


# DynamoDB Local files
.dynamodb/


# TernJS port file
.tern-port


# Stores VSCode versions used for testing VSCode extensions
.vscode-test


# yarn v2
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz
.pnp.*


# IDE
.vscode/
.idea/
*.swp
*.swo
*~


# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db`,
    },
    "/vite.svg": {
      code: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 410 404">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#41D1FF" offset="0%"/>
      <stop stop-color="#BD34FE" offset="100%"/>
    </linearGradient>
  </defs>
  <path fill="url(#g)" d="M399.6 57.7L215.6 388.4c-3.7 6.6-13.3 6.6-17 0L10.4 57.7c-4.2-7.6 2.3-16.7 10.8-15.4l174.8 27.3a10 10 0 0 0 11.6-7.7l27.1-104.6c2.1-7.9 13.4-7.9 15.6 0l27.1 104.6a10 10 0 0 0 11.6 7.7l174.8-27.3c8.5-1.3 15 7.8 10.8 15.4z"/>
</svg>`,
    },
    "package-lock.json": {
      code: JSON.stringify(
        packageLock,
        null,
        2
      ),
    },
  };

  return files;
}
