import * as React from "react"
import { LiveProvider, LivePreview, LiveError } from "react-live"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Lightbulb } from "lucide-react"

// Prepara código para react-live (noInline):
// - Elimina imports
// - Convierte export default function/class a declaración simple
// - Elimina "export default X;" finales
// - Agrega render(<Root />)
function prepareLiveCode(input: string): string {
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

export function ReactLivePreview({ code }: { code: string }) {
  const scope = {
    React,
    useState: React.useState,
    useEffect: React.useEffect,
    useRef: React.useRef,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Input,
    Textarea,
    Label,
    Badge,
    Lightbulb,
  }

  const preparedCode = React.useMemo(() => prepareLiveCode(code), [code])

  return (
    <LiveProvider code={preparedCode} scope={scope} language="jsx" noInline>
      <div className="relative flex w-full flex-col gap-2">
        <div className="flex-1 overflow-auto rounded-xl border border-border/60 bg-card/70 shadow-sm">
          <LivePreview />
        </div>
        <pre className="min-h-0 whitespace-pre-wrap text-xs text-destructive">
          <LiveError />
        </pre>
      </div>
    </LiveProvider>
  )
}
