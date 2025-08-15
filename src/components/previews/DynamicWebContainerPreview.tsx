import * as React from "react";
import { GeneratingLoader } from "../loading/GeneratingLoader";
import { loadCodeForEnv, loadCodeWithCache } from "../../services/codeLoader";
import type { PreviewEnv } from "../../lib/constants";

interface DynamicWebContainerPreviewProps {
  projectData: {
    name: string;
    description: string;
  };
  env: PreviewEnv;
  onCodeLoaded?: (code: string, filename: string, extras?: import("../../lib/webcontainerMoreFiles").DynamicFileEntry[]) => void;
  onCancel?: () => void;
  messages?: string[];
}

function useLoadCode(
  projectData: DynamicWebContainerPreviewProps["projectData"],
  env: PreviewEnv,
) {
  const [codeData, setCodeData] = React.useState<{
    code: string;
    file: string;
  } & { extras?: import("../../lib/webcontainerMoreFiles").DynamicFileEntry[] } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const cacheKey = `${env}-${projectData.name}-${projectData.description}`;

    loadCodeWithCache(cacheKey, () => loadCodeForEnv(projectData, env))
      .then((result) => {
        if (cancelled) return;
        setCodeData(result as typeof result & { extras?: import("../../lib/webcontainerMoreFiles").DynamicFileEntry[] });
        setError(null);
      })
      .catch((err) => {
        console.error("Error loading code (webcontainer):", err);
        if (cancelled) return;
        const detail = err instanceof Error ? err.message : String(err);
        setError(`No se pudo cargar el código: ${detail}. Usando una versión básica...`);
        const fallbackCode = generateFallbackCode(projectData);
        setCodeData({ code: fallbackCode, file: "GeneratedComponent.jsx" });
      });
    return () => {
      cancelled = true;
    };
  }, [projectData, env]);

  return { codeData, error };
}

function generateFallbackCode(projectData: {
  name: string;
  description: string;
}): string {
  return `export default function ${
    projectData.name.replace(/[^a-zA-Z0-9]/g, "") || "MyApp"
  }() {
  return (
    <div className="min-h-screen p-6 flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 shadow-sm">
        <div className="p-6">
          <h1 className="m-0 text-2xl font-bold">${projectData.name}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">${projectData.description}</p>
          <div className="mt-4">
            <button className="inline-flex items-center rounded-md bg-emerald-500 text-white px-4 py-2 text-sm hover:bg-emerald-600 transition-colors">
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}`;
}

function CodeRenderer({
  projectData,
  env,
  onCodeLoaded,
  onCancel,
  messages,
}: DynamicWebContainerPreviewProps) {
  const { codeData, error } = useLoadCode(projectData, env);

  React.useEffect(() => {
    if (codeData && onCodeLoaded) {
      onCodeLoaded(codeData.code, codeData.file, codeData.extras);
    }
  }, [codeData, onCodeLoaded]);

  if (error && !codeData) {
    return (
      <div className="rounded-xl border border-border/60 bg-card/70 p-6 text-center shadow-sm">
        <div className="text-destructive text-sm mb-2">⚠️ Error de carga</div>
        <p className="text-muted-foreground text-xs">{error}</p>
      </div>
    );
  }

  if (!codeData) {
    return (
      <GeneratingLoader
        message="Cargando componente..."
        onCancel={onCancel}
        messages={messages}
      />
    );
  }

  // Igual que en sandpack: App montará la vista "loaded" y usará WebContainerPreview.
  return (
    <GeneratingLoader
      message="Cargando componente..."
      onCancel={onCancel}
      messages={messages}
    />
  );
}

export function DynamicWebContainerPreview({
  projectData,
  env,
  onCodeLoaded,
  onCancel,
  messages,
}: DynamicWebContainerPreviewProps) {
  return (
    <CodeRenderer
      projectData={projectData}
      env={env}
      onCodeLoaded={onCodeLoaded}
      onCancel={onCancel}
      messages={messages}
    />
  );
}
