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

/**
 * Genera el árbol de archivos que se enviará a WebContainers combinando la
 * plantilla base Vite+React+Tailwind (proveniente de `buildFilesForSandpack`)
 * con archivos adicionales recibidos dinámicamente.
 *
 * 1. Se parte de la plantilla base para asegurar que exista un proyecto Vite
 *    válido (index.html, main.tsx, Tailwind, configs, etc.).
 * 2. Cada entrada en `extras` se normaliza para que comience con `/` y luego se
 *    aplica sobre el árbol de archivos. Si `overwrite` es `false` y ya existe
 *    el archivo, se conserva el original.
 */
export function buildFilesForWebContainerMore(
  extras: DynamicFileEntry[],
  /** Código base para /src/App.tsx si no es provisto por extras */
  defaultAppCode: string = `export default function App(){ return <div>Hello WebContainer</div>; }`,
) {
  const base = buildFilesForSandpack(defaultAppCode);

  for (const { path, code, overwrite = true } of extras) {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    if (!overwrite && base[normalized]) continue;
    base[normalized] = { code };
  }

  return base;
}
