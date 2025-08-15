export function buildFilesForSandpack(code: string) {
  // Ubicamos el código como App.jsx y un index.js que monta el root
  const appFile = "/App.jsx";
  const indexFile = "/index.js";

  const files: Record<string, { code: string }> = {
    [appFile]: { code },
    [indexFile]: {
      code: `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
    },
    "/package.json": {
      code: JSON.stringify(
        {
          name: "sandpack-app",
          version: "0.0.0",
          private: true,
          main: "index.js",
          dependencies: {
            react: "18.2.0",
            "react-dom": "18.2.0",
          },
        },
        null,
        2
      ),
    },
    "/public/index.html": {
      code: `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sandpack App</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
    },
    "/styles.css": {
      code: `html, body, #root { height: 100%; }
body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, sans-serif; }
* { box-sizing: border-box; }`,
    },
  };

  return files;
}
