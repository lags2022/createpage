import { useState } from "react"
import { ExternalLink } from "lucide-react"
import { useSandpackClient } from "@codesandbox/sandpack-react"
import { Button } from "../ui/button"

type CodeSandboxURLs = {
  sandboxId?: string
  editorUrl?: string
  embedUrl?: string
}
type ClientWithCSBURL = {
  getCodeSandboxURL: () => CodeSandboxURLs
}

export function SandpackUrlButton() {
  const { getClient } = useSandpackClient()
  const [isGettingUrl, setIsGettingUrl] = useState(false)

  const handleGetUrl = async () => {
    const client = getClient()
    if (!client) return
    
    setIsGettingUrl(true)
    try {
      // Crear sandbox y obtener URLs
      const urlData = (client as unknown as ClientWithCSBURL).getCodeSandboxURL()
      if (urlData && urlData.embedUrl) {
        // Abrir la URL de vista previa (embedUrl) en una nueva pestaña
        window.open(urlData.embedUrl, '_blank')
      } else if (urlData && urlData.editorUrl) {
        // Fallback al editor si no hay embedUrl
        window.open(urlData.editorUrl, '_blank')
      }
    } catch (error) {
      console.error('Error obteniendo URL de CodeSandbox:', error)
    } finally {
      setIsGettingUrl(false)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleGetUrl}
      disabled={isGettingUrl || !getClient()}
      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
      title="Abrir en CodeSandbox"
    >
      <ExternalLink className="h-3 w-3" />
    </Button>
  )
}
