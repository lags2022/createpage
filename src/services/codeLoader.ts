// Servicio para simular la carga de código desde diferentes fuentes
// En el futuro, esto podría ser una API real
import { PREVIEW_API_URLS } from "../lib/constants";
import type { PreviewEnv } from "../lib/constants";

import type { DynamicFileEntry } from "../lib/webcontainerMoreFiles";

interface CodeResponse {
  file: string;
  code: string;
  extras?: DynamicFileEntry[];
}

// Simula una petición HTTP con delay para mostrar el loading
// const simulateDelay = (ms: number = 1500) =>
//   new Promise((resolve) => setTimeout(resolve, ms));

export async function loadCodeFromMock(): Promise<CodeResponse> {
  // Simular delay de red
  // await simulateDelay(2000 + Math.random() * 1000); // 2-3 segundos

  try {
    // Simular importación dinámica del JSON
    const response = await import("../mocks/data-n8n.json");

    if (!response.default) {
      throw new Error("No se pudo cargar el código fuente");
    }

    return {
      file: response.default.file || "Component.jsx",
      code:
        response.default.code ||
        "export default function Component() { return <div>Error</div> }",
    };
  } catch (error) {
    console.error("Error cargando código:", error);
    throw new Error("Failed to load component code");
  }
}

// Compatibilidad previa: mantenemos esta función apuntando al mock
export async function loadCodeFromAPI(): Promise<CodeResponse> {
  console.warn(
    "loadCodeFromAPI está en desuso. Usar loadCodeForEnv(projectData, env)"
  );
  return loadCodeFromMock();
}

// Nueva función con soporte de entornos
export async function loadCodeForEnv(
  projectData: { name: string; description: string },
  env: PreviewEnv
): Promise<CodeResponse> {
  switch (env) {
    case "mock-one-component": {
      return loadCodeFromMock();
    }
    case "n8n-ia-one-component": {
      const url = PREVIEW_API_URLS[env];
      if (!url) {
        // Si no hay URL configurada, usar mock para no romper el flujo
        return loadCodeFromMock();
      }
      // Pequeño delay para UX consistente
      // await simulateDelay(500);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: `${projectData.name} - ${projectData.description}`,
          }),
        });
        if (!res.ok) {
          let detail = "";
          try {
            detail = await res.text();
          } catch {
            // ignorar errores al leer el cuerpo
            detail = "";
          }
          throw new Error(`HTTP ${res.status}${detail ? `: ${detail}` : ""}`);
        }
        const data = await res.json();
        const file = (data && data.file) || "Component.jsx";
        const code = data && data.code;
        if (!code || typeof code !== "string") {
          throw new Error("Respuesta inválida: falta 'code'");
        }
        return { file, code };
      } catch (error) {
        console.error("Error cargando código desde n8n:", error);
        // Propaga el error para que el caller decida fallback o mostrar error
        throw error;
      }
    }
    case "mock-more-components": {
      // Lee un arreglo de archivos desde el mock local
      // await simulateDelay(1000);
      const dataMod = await import("../mocks/data-n8n-more.json");
      const entries: DynamicFileEntry[] = Array.isArray(dataMod.default)
        ? dataMod.default
        : [];
      if (!entries.length) throw new Error("Mock vacío");
      // Buscar App.tsx o equivalente
      const appEntry =
        entries.find((e) => /App\.(t|j)sx?$/.test(e.path)) || entries[0];
      return {
        file: appEntry.path,
        code: appEntry.code,
        extras: entries,
      };
    }
    case "n8n-ia-more-components": {
      const url = PREVIEW_API_URLS[env];
      if (!url) {
        return loadCodeForEnv(projectData, "mock-more-components");
      }
      // await simulateDelay(500);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: `${projectData.name} - ${projectData.description}`,
          }),
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}${detail ? `: ${detail}` : ""}`);
        }

        const data = await res.json();
        console.log("Response from n8n:", data);
        // Soportamos dos formatos:
        // 1) { files: [{ path, code }] }
        // 2) Array directa [{ path, code }]
        const filesArr: DynamicFileEntry[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.files)
          ? data.files
          : [];
        if (!filesArr.length) throw new Error("Respuesta sin archivos");
        const appEntry =
          filesArr.find((f) => /App\.(t|j)sx?$/.test(f.path)) || filesArr[0];
        console.log("App entry:", appEntry);
        return {
          file: appEntry.path,
          code: appEntry.code,
          extras: filesArr,
        };
      } catch (error) {
        console.error("Error cargando código n8n más componentes:", error);
        throw error;
      }
    }
    default: {
      return loadCodeFromMock();
    }
  }
}

// Cache simple para evitar recargas innecesarias
const codeCache = new Map<string, CodeResponse>();

export async function loadCodeWithCache(
  key: string,
  loader: () => Promise<CodeResponse>
): Promise<CodeResponse> {
  if (codeCache.has(key)) {
    return codeCache.get(key)!;
  }

  const result = await loader();
  codeCache.set(key, result);
  return result;
}

export function clearCodeCache() {
  codeCache.clear();
}
