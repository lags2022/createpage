import * as React from "react";
import { GeneratingLoader } from "../loading/GeneratingLoader";
import { loadCodeForEnv, loadCodeWithCache } from "../../services/codeLoader";
import type { PreviewEnv } from "../../lib/constants";

interface DynamicCodeLoaderProps {
  projectData: {
    name: string;
    description: string;
  };
  env: PreviewEnv;
  onCodeLoaded?: (code: string, filename: string) => void;
  onCancel?: () => void;
  messages?: string[];
}

function useLoadCode(
  projectData: DynamicCodeLoaderProps["projectData"],
  env: PreviewEnv,
) {
  const [codeData, setCodeData] = React.useState<{
    code: string;
    file: string;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const cacheKey = `${env}-${projectData.name}-${projectData.description}`;

    loadCodeWithCache(cacheKey, () => loadCodeForEnv(projectData, env))
      .then((result) => {
        if (cancelled) return;
        setCodeData(result);
        setError(null);
      })
      .catch((err) => {
        console.error("Error loading code (sandpack):", err);
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
    <div style={{
      padding: '2rem',
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 'bold' }}>
        ${projectData.name}
      </h1>
      <p style={{ color: '#374151', lineHeight: 1.6 }}>
        ${projectData.description}
      </p>
      <div style={{ marginTop: '1rem' }}>
        <button style={{
          background: '#0ea5e9',
          color: 'white',
          border: 'none',
          padding: '0.6rem 1.2rem',
          borderRadius: '6px',
          fontSize: '1rem',
          cursor: 'pointer'
        }}>
          Continuar
        </button>
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
}: DynamicCodeLoaderProps) {
  const { codeData, error } = useLoadCode(projectData, env);

  React.useEffect(() => {
    if (codeData && onCodeLoaded) {
      onCodeLoaded(codeData.code, codeData.file);
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
  // Nota: no renderizamos el preview aquí; App alternará a la vista "loaded" y montará el Provider + Runner.
  return (
    <GeneratingLoader
      message="Cargando componente..."
      onCancel={onCancel}
      messages={messages}
    />
  );
}

export function DynamicSandpackPreview({
  projectData,
  env,
  onCodeLoaded,
  onCancel,
  messages,
}: DynamicCodeLoaderProps) {
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
