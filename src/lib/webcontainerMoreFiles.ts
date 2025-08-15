import { buildFilesForSandpack } from "./sandpackFiles";

/**
 * Entrada para archivos dinámicos que vendrán de un prompt. `overwrite` indica si
 * debe reemplazar (true, por defecto) o conservar (false) cuando ya existe un
 * archivo base con la misma ruta.
 */
export interface DynamicFileEntry {
  path: string;
  code: string;
  overwrite?: boolean;
}

/** Normaliza rutas a formato de proyecto Vite. */
function normalizePath(p: string): string {
  const trimmed = p.trim().replace(/\\+/g, "/").replace(/\s+$/g, "");
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  // Colapsar múltiples slashes
  return withSlash.replace(/\/+/g, "/");
}

/**
 * Genera el árbol de archivos que se enviará a WebContainers combinando la
 * plantilla base Vite+React+Tailwind (proveniente de `buildFilesForSandpack`)
 * con archivos adicionales recibidos dinámicamente.
 *
 * 1. Se parte de la plantilla base para asegurar que exista un proyecto Vite
 *    válido (index.html, main.tsx, Tailwind, configs, etc.).
 * 2. Cada entrada en `extras` se sanea: aceptamos `path`, `file` o `path ` (con espacio).
 * 3. Si `overwrite` es `false` y ya existe el archivo, se conserva el original.
 * 4. Si faltan `/src/main.tsx` o `/src/index.css`, se crean con contenido mínimo (sin CDN).
 */
export function buildFilesForWebContainerMore(
  extras: DynamicFileEntry[],
  /** Código base para /src/App.tsx si no es provisto por extras */
  defaultAppCode: string = `import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

function Home() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Inicio</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Bienvenido a la app de ejemplo.</p>
    </div>
  )
}

function About() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Acerca</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Pequeña demo con React Router.</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <nav className="p-3 border-b border-border/60 flex gap-4 bg-background/70">
        <Link className="text-primary hover:underline" to="/">Inicio</Link>
        <Link className="text-primary hover:underline" to="/about">Acerca</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  )
}`
) {
  const base = buildFilesForSandpack(defaultAppCode);

  for (const entry of extras) {
    // Aceptar variantes comunes de la clave de ruta
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyEntry = entry as any;
    const rawPath: unknown = (entry && (entry.path as unknown))
      ?? anyEntry?.file
      ?? anyEntry?.["path "]
      ?? anyEntry?.Path
      ?? anyEntry?.PATH;
    const rawCode: unknown = (entry && (entry.code as unknown)) ?? anyEntry?.contents ?? anyEntry?.content;
    const overwrite: boolean = typeof entry.overwrite === "boolean" ? entry.overwrite : true;

    if (typeof rawPath !== "string" || !rawPath.trim()) {
      // Entrada inválida: sin ruta usable
      continue;
    }
    if (typeof rawCode !== "string") {
      // Coaccionar a string si viene no-string; si queda vacío, saltar
      if (rawCode == null) continue;
      try {
        const str = String(rawCode);
        if (!str.trim()) continue;
        const normalized = normalizePath(rawPath);
        if (!overwrite && base[normalized]) continue;
        base[normalized] = { code: str };
      } catch {
        continue;
      }
      continue;
    }

    const normalized = normalizePath(rawPath);
    if (!overwrite && base[normalized]) continue;
    base[normalized] = { code: rawCode };
  }

  // Fallbacks mínimos si faltan estos archivos clave
  const mainPath = "/src/main.tsx";
  const cssPath = "/src/index.css";

  if (!base[mainPath]) {
    base[mainPath] = {
      code: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
`,
    };
  }

  if (!base[cssPath]) {
    base[cssPath] = {
      code: `@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }
body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, sans-serif; }`,
    };
  }

  return base;
}
