import * as React from "react"

// Toma el código fuente y lo adapta para ejecutarse con Babel en el iframe
// - Elimina imports
// - Convierte export default function/class a declaración simple
// - Elimina "export default X;" finales
// - Agrega render(<Root />)
function prepareIframeCode(input: string): string {
  let processed = input
  // Remover imports en cualquier lugar
  processed = processed.replace(/^\s*import[^;]*;\s*$/gm, "")

  // Quitar anotaciones genéricas en hooks (p.ej., useState<User[]>) que pueden
  // generar ambigüedad JSX en Babel Standalone.
  const stripHookGenerics = (src: string) => {
    const hooks = ["useState", "useRef", "useMemo", "useCallback", "useReducer"]
    for (const h of hooks) {
      // useState<T>
      src = src.replace(new RegExp(`\\b${h}\\s*<[^>]*>`, "g"), h)
      // React.useState<T>
      src = src.replace(new RegExp(`\\bReact\\.${h}\\s*<[^>]*>`, "g"), `React.${h}`)
    }
    // React.FC<Props> -> any
    src = src.replace(/\bReact\.FC\s*<[^>]*>/g, "any")
    return src
  }
  processed = stripHookGenerics(processed)

  // export default function Nombre() {...}
  const funcMatch = processed.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/)
  let root = "Component"
  if (funcMatch) {
    root = funcMatch[1]
    processed = processed.replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/, "function $1")
  } else {
    // export default class Nombre {...}
    const classMatch = processed.match(/export\s+default\s+class\s+([A-Za-z0-9_]+)/)
    if (classMatch) {
      root = classMatch[1]
      processed = processed.replace(/export\s+default\s+class\s+([A-Za-z0-9_]+)/, "class $1")
    }
    // export default Nombre;
    const refMatch = processed.match(/export\s+default\s+([A-Za-z0-9_]+)\s*;/)
    if (refMatch) {
      root = refMatch[1]
      processed = processed.replace(/export\s+default\s+([A-Za-z0-9_]+)\s*;/, "")
    }
    // export default () => {...}
    if (/export\s+default\s*\(/.test(processed)) {
      processed = processed.replace(/export\s+default\s*\(/, "const Component = (")
      root = "Component"
    }
  }

  return processed + `\n\nrender(<${root} />);`
}

interface IframePreviewProps {
  code: string
  className?: string
  title?: string
}

export function IframePreview({ code, className, title = "Vista previa" }: IframePreviewProps) {
  const prepared = React.useMemo(() => prepareIframeCode(code), [code])

  const srcDoc = React.useMemo(() => {
    // Documento HTML aislado; usa React/ReactDOM UMD + Babel Standalone
    return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- Tailwind Play CDN para estilos dentro del iframe -->
    <script>
      // Configuración mínima: usar darkMode por clase (debe declararse antes de cargar el CDN)
      try { window.tailwind = window.tailwind || {}; window.tailwind.config = { darkMode: 'class' } } catch (e) { /* no-op */ }
    </script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      html, body, #root { height: 100%; margin: 0; }
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, sans-serif; }
      * { box-sizing: border-box; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      // Sincronizar modo oscuro del documento padre (si existe)
      try {
        const updateDark = () => {
          const isDark = window.parent && window.parent.document && window.parent.document.documentElement.classList.contains('dark');
          document.documentElement.classList.toggle('dark', !!isDark);
        };
        updateDark();
        const obs = new MutationObserver(updateDark);
        if (window.parent && window.parent.document) {
          obs.observe(window.parent.document.documentElement, { attributes: true, attributeFilter: ['class'] });
        }
        // Fallback/adicional: seguir el esquema de color del SO
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        document.documentElement.classList.toggle('dark', mql.matches);
        mql.addEventListener('change', (e) => document.documentElement.classList.toggle('dark', e.matches));
      } catch (e) { /* no-op sandbox */ }
    </script>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script type="text/babel" data-presets="react,typescript">
      /* @jsx React.createElement */
      /* @jsxFrag React.Fragment */
      const root = ReactDOM.createRoot(document.getElementById('root'));
      function render(element) { root.render(element); }
      // Exponer hooks y Fragment como variables locales para soportar código que los usa sin prefijo
      const { useState, useEffect, useRef, useMemo, useCallback, Fragment } = React;
      try {
${prepared
  .split("\n")
  .map((l) => "        " + l)
  .join("\n")}
      } catch (e) {
        const Err = () => React.createElement('pre', { style: { color: '#b00020', whiteSpace: 'pre-wrap', padding: '16px' } }, String(e && e.stack || e));
        render(React.createElement(Err));
        console.error(e);
      }
    </script>
  </body>
</html>`
  }, [prepared])

  return (
    <div className={className}>
      <iframe
        title={title}
        sandbox="allow-scripts allow-forms allow-modals"
        srcDoc={srcDoc}
        style={{ width: "100%", height: "100%", border: "0", background: "transparent" }}
      />
    </div>
  )
}
