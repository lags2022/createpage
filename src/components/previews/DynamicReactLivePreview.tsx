import * as React from "react"
import { Suspense } from "react"
import { GeneratingLoader } from "../loading/GeneratingLoader"
import { loadCodeForEnv, loadCodeWithCache } from "../../services/codeLoader"
import type { PreviewEnv } from "../../lib/constants"

// Componente que maneja la carga dinámica con Suspense
const ReactLivePreviewLazy = React.lazy(() => 
  import("./ReactLivePreview").then(module => ({ default: module.ReactLivePreview }))
)

interface DynamicCodeLoaderProps {
  projectData: {
    name: string
    description: string
  }
  env: PreviewEnv
  onCodeLoaded?: (code: string, filename: string) => void
  onCancel?: () => void
  messages?: string[]
}

// Hook que maneja la carga de código con Suspense
function useLoadCode(projectData: DynamicCodeLoaderProps["projectData"], env: PreviewEnv) {
  const [codeData, setCodeData] = React.useState<{ code: string; file: string } | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    const cacheKey = `${env}-${projectData.name}-${projectData.description}`
    
    loadCodeWithCache(cacheKey, () => loadCodeForEnv(projectData, env))
      .then((result) => {
        if (cancelled) return
        setCodeData(result)
        setError(null)
      })
      .catch((err) => {
        console.error('Error loading code:', err)
        if (cancelled) return
        const detail = err instanceof Error ? err.message : String(err)
        setError(`No se pudo cargar el código: ${detail}. Usando una versión básica...`)
        // Fallback: generar código básico basado en los datos del proyecto
        const fallbackCode = generateFallbackCode(projectData)
        setCodeData({ code: fallbackCode, file: 'GeneratedComponent.jsx' })
      })
    return () => { cancelled = true }
  }, [projectData, env])

  return { codeData, error }
}

// Genera código de fallback si falla la carga
function generateFallbackCode(projectData: { name: string; description: string }): string {
  return `export default function ${projectData.name.replace(/[^a-zA-Z0-9]/g, '') || 'MyApp'}() {
  return (
    <div style={{
      padding: '2rem',
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '1.5rem'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>
          ${projectData.name}
        </h1>
      </div>
      
      <div style={{
        background: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <p style={{ color: '#495057', lineHeight: 1.6, margin: 0 }}>
          ${projectData.description}
        </p>
      </div>
      
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button style={{
          background: '#667eea',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '6px',
          fontSize: '1rem',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}>
          Comenzar
        </button>
      </div>
    </div>
  )
}`
}

// Componente interno que renderiza el código una vez cargado
function CodeRenderer({ projectData, env, onCodeLoaded, onCancel, messages }: DynamicCodeLoaderProps) {
  const { codeData, error } = useLoadCode(projectData, env)

  React.useEffect(() => {
    if (codeData && onCodeLoaded) {
      onCodeLoaded(codeData.code, codeData.file)
    }
  }, [codeData, onCodeLoaded])

  if (error && !codeData) {
    return (
      <div className="rounded-xl border border-border/60 bg-card/70 p-6 text-center shadow-sm">
        <div className="text-destructive text-sm mb-2">⚠️ Error de carga</div>
        <p className="text-muted-foreground text-xs">{error}</p>
      </div>
    )
  }

  if (!codeData) {
    return <GeneratingLoader message="Cargando componente..." onCancel={onCancel} messages={messages} />
  }

  return (
    <Suspense fallback={<GeneratingLoader message="Renderizando componente..." onCancel={onCancel} messages={messages} />}>
      <div className="space-y-2">
        {error ? (
          <div className="px-4 py-2 text-xs text-destructive border border-border/60 rounded-md bg-background/80">
            ⚠️ {error}
          </div>
        ) : null}
        <ReactLivePreviewLazy code={codeData.code} />
      </div>
    </Suspense>
  )
}

// Componente principal exportado
export function DynamicReactLivePreview({ projectData, env, onCodeLoaded, onCancel, messages }: DynamicCodeLoaderProps) {
  return (
    <Suspense fallback={<GeneratingLoader onCancel={onCancel} messages={messages} />}>
      <CodeRenderer projectData={projectData} env={env} onCodeLoaded={onCodeLoaded} onCancel={onCancel} messages={messages} />
    </Suspense>
  )
}
