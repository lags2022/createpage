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
    <style>
      html, body, #root { height: 100%; margin: 0; }
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, sans-serif; }
      * { box-sizing: border-box; }
    </style>
  </head>
  <body>
    <div id="root"></div>
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
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
        srcDoc={srcDoc}
        style={{ width: "100%", height: "100%", border: "0", background: "transparent" }}
      />
    </div>
  )
}
