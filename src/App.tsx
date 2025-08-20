import "./App.css";
import { Lightbulb, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Badge } from "./components/ui/badge";
import { clearCodeCache } from "./services/codeLoader";
import { DEFAULT_PREVIEW_ENV, PREVIEW_ENV_OPTIONS } from "./lib/constants";
import type { PreviewEnv } from "./lib/constants";
import { SandpackProvider } from "@codesandbox/sandpack-react";
import { amethyst, aquaBlue } from "@codesandbox/sandpack-themes";
import { useTheme } from "./hooks/use-theme";
import { buildFilesForSandpack } from "./lib/sandpackFiles";
import { SandpackRunner } from "./components/previews/SandpackRunner";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "./components/ui/select";
import { ThemeToggle } from "./components/theme-toggle";
import { ReactLivePreview } from "./components/previews/ReactLivePreview";
import { DynamicReactLivePreview } from "./components/previews/DynamicReactLivePreview";
import { IframePreview } from "./components/previews/IframePreview";
import { DynamicIframePreview } from "./components/previews/DynamicIframePreview";
import { DynamicSandpackPreview } from "./components/previews/DynamicSandpackPreview";
import { SandpackUrlButton } from "./components/previews/SandpackUrlButton";
import { WebContainerPreview } from "./components/previews/WebContainerPreview";
import { DynamicWebContainerPreview } from "./components/previews/DynamicWebContainerPreview";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
} from "./components/ui/sidebar";
import { Textarea } from "./components/ui/textarea";

// Componente interno que tiene acceso a useSidebar
function AppContent() {
  const { setOpenMobile } = useSidebar();
  const [projectName, setProjectName] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const theme = useTheme();
  const maxChars = 500;
  const tooLong = oneLiner.length > maxChars;
  const canContinue =
    projectName.trim().length > 2 && oneLiner.trim().length > 5 && !tooLong;
  type PreviewMode = "react-live" | "iframe" | "sandpack" | "webcontainer";
  const [previewMode, setPreviewMode] = useState<PreviewMode>("webcontainer");
  // Entorno de datos (mock / n8n)
  const [previewEnv, setPreviewEnv] = useState<PreviewEnv>(DEFAULT_PREVIEW_ENV);
  // Estados por modo: generación y código cargado
  const [isGeneratingByMode, setIsGeneratingByMode] = useState<
    Record<PreviewMode, boolean>
  >({
    "react-live": false,
    iframe: false,
    sandpack: false,
    webcontainer: false,
  });
  const [loadedCodeByMode, setLoadedCodeByMode] = useState<
    Record<PreviewMode, { code: string; filename: string; extras?: import("./lib/webcontainerMoreFiles").DynamicFileEntry[] } | null>
  >({
    "react-live": null,
    iframe: null,
    sandpack: null,
    webcontainer: null,
  });

  // El cambio de modo ahora lo maneja Radix Select vía onValueChange

  // Tema para Sandpack se maneja dentro de SandpackRunner

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canContinue) return;

    // Cerrar sidebar en responsive al presionar Continuar
    setOpenMobile(false);

    // Activar generación solo para el modo actual y limpiar solo ese modo
    setIsGeneratingByMode((prev) => ({ ...prev, [previewMode]: true }));
    setLoadedCodeByMode((prev) => ({ ...prev, [previewMode]: null }));
  }

  // Mensajes cíclicos del loader
  const loaderMessages = [
    "Analizando tu idea",
    "Diseñando componentes",
    "Armando UI",
    "Aplicando estilos",
    "Puliendo detalles",
  ];

  // Cancelar generación (para cualquier modo)
  function cancelGeneration() {
    setIsGeneratingByMode((prev) => ({ ...prev, [previewMode]: false }));
  }

  const retryPreview = () => {
    clearCodeCache();
    setIsGeneratingByMode((prev) => ({ ...prev, [previewMode]: true }));
    setLoadedCodeByMode((prev) => ({ ...prev, [previewMode]: null }));
  };

  // Manejar cuando se carga código dinámicamente
  const handleCodeLoadedForMode =
    (mode: PreviewMode) => (code: string, filename: string, extras?: import("./lib/webcontainerMoreFiles").DynamicFileEntry[]) => {
      setLoadedCodeByMode((prev) => ({ ...prev, [mode]: { code, filename, extras } }));
      setIsGeneratingByMode((prev) => ({ ...prev, [mode]: false }));
    };

  // Derivados por modo actual
  const isGenerating = isGeneratingByMode[previewMode];
  const loadedCode = loadedCodeByMode[previewMode];

  return (
    <>
      <Sidebar variant="sidebar" collapsible="offcanvas" side="left">
        <SidebarHeader>
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex items-center gap-2">
              <div className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">
                <Lightbulb className="size-4" />
              </div>
              <span className="text-sm font-semibold">StartNow</span>
            </div>
            {/* Botón para ocultar sidebar solo en responsive */}
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Cuéntanos sobre tu idea</SidebarGroupLabel>
            <SidebarGroupContent>
              <form
                onSubmit={onSubmit}
                noValidate
                className="flex flex-col gap-4 p-1"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="projectName">Nombre del proyecto</Label>
                  <Input
                    id="projectName"
                    placeholder="ej. MiApp Revolucionaria"
                    value={projectName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setProjectName(e.target.value)
                    }
                    aria-invalid={
                      projectName.trim().length > 0 &&
                      projectName.trim().length <= 2
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="oneLiner" className="mb-0">
                      Describe tu idea en una frase
                    </Label>
                    <Badge variant="outline" className="ml-1">
                      IA Ready
                    </Badge>
                  </div>
                  <Textarea
                    id="oneLiner"
                    placeholder="ej. Una app que conecta a dueños de mascotas con veterinarios para consultas virtuales las 24 horas"
                    value={oneLiner}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setOneLiner(e.target.value)
                    }
                    aria-invalid={tooLong}
                    aria-describedby="oneLinerHelp oneLinerCount"
                    className="min-h-[96px]"
                  />
                  {/* <p
                    id="oneLinerHelp"
                    className="text-xs text-muted-foreground"
                  >
                    Sé específico sobre qué problema resuelves y para quién.
                  </p> */}
                  <div
                    id="oneLinerCount"
                    className={`text-xs ${
                      tooLong ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {oneLiner.length}/{maxChars}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="previewMode">Modo de previsualización</Label>
                  <Select
                    value={previewMode}
                    onValueChange={(
                      v: "react-live" | "iframe" | "sandpack" | "webcontainer"
                    ) => setPreviewMode(v)}
                  >
                    <SelectTrigger
                      id="previewMode"
                      aria-label="Modo de previsualización"
                    >
                      <SelectValue placeholder="webcontainer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webcontainer">webcontainer</SelectItem>
                      <SelectItem value="react-live">react-live</SelectItem>
                      <SelectItem value="sandpack">sandpack</SelectItem>
                      <SelectItem value="iframe">iframe</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* <p className="text-xs text-muted-foreground">
                    Modos activos: react-live, iframe, sandpack y webcontainer.
                  </p> */}
                </div>

                <div className="pt-1">
                  <Button
                    className="w-full dark:bg-primary dark:text-white"
                    type="submit"
                    disabled={!canContinue}
                  >
                    Continuar
                  </Button>
                </div>

                {/* Selector de entorno de datos */}
                <div className="space-y-1.5">
                  <Label htmlFor="previewEnv">Entorno de datos</Label>
                  <Select
                    value={previewEnv}
                    onValueChange={(v: PreviewEnv) => setPreviewEnv(v)}
                  >
                    <SelectTrigger
                      id="previewEnv"
                      aria-label="Entorno de datos"
                    >
                      <SelectValue placeholder="mock-one-component" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREVIEW_ENV_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.id}
                          value={opt.id}
                          disabled={opt.disabled}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* <p className="text-xs text-muted-foreground">
                    Soporta mock (1 ó varios componentes) y n8n (1 componente). "more-components" IA aún en desarrollo.
                  </p> */}
                </div>
              </form>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter />
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-h-0">
        <header className="sticky top-0 z-10 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-12 items-center gap-2 px-4">
            <SidebarTrigger />
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="flex-1 min-h-0 overflow-hidden p-4">
          <div className="mx-auto grid w-full max-w-full gap-4 min-h-full">
            {previewMode === "react-live" ? (
              isGenerating ? (
                <DynamicReactLivePreview
                  projectData={{
                    name: projectName,
                    description: oneLiner,
                  }}
                  env={previewEnv}
                  onCodeLoaded={handleCodeLoadedForMode("react-live")}
                  onCancel={cancelGeneration}
                  messages={loaderMessages}
                />
              ) : loadedCode ? (
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate">📄 {loadedCode.filename}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={retryPreview}
                      aria-label="Reintentar previsualización"
                      title="Reintentar"
                      className="text-primary"
                      disabled={isGenerating}
                    >
                      <RotateCcw
                        className={`size-4 ${
                          isGenerating ? "animate-spin" : ""
                        }`}
                      />
                    </Button>
                  </div>
                  <ReactLivePreview code={loadedCode.code} />
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 p-6 text-sm text-muted-foreground shadow-sm flex items-center justify-center">
                  <p className="text-center">
                    Completa el formulario y presiona "Continuar" para ver la
                    previsualización.
                  </p>
                </div>
              )
            ) : previewMode === "iframe" ? (
              isGenerating ? (
                <DynamicIframePreview
                  projectData={{
                    name: projectName,
                    description: oneLiner,
                  }}
                  env={previewEnv}
                  onCodeLoaded={handleCodeLoadedForMode("iframe")}
                  onCancel={cancelGeneration}
                  messages={loaderMessages}
                />
              ) : loadedCode ? (
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate">📄 {loadedCode.filename}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={retryPreview}
                      aria-label="Reintentar previsualización"
                      title="Reintentar"
                      className="text-primary"
                      disabled={isGenerating}
                    >
                      <RotateCcw
                        className={`size-4 ${
                          isGenerating ? "animate-spin" : ""
                        }`}
                      />
                    </Button>
                  </div>
                  <div className="flex-1 rounded-xl border border-border/60 shadow-sm overflow-hidden h-[calc(100vh-200px)]">
                    <IframePreview code={loadedCode.code} className="h-full" />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 p-6 text-sm text-muted-foreground shadow-sm flex items-center justify-center">
                  <p className="text-center">
                    Completa el formulario y presiona "Continuar" para ver la
                    previsualización.
                  </p>
                </div>
              )
            ) : previewMode === "sandpack" ? (
              isGenerating ? (
                <DynamicSandpackPreview
                  projectData={{
                    name: projectName,
                    description: oneLiner,
                  }}
                  env={previewEnv}
                  onCodeLoaded={handleCodeLoadedForMode("sandpack")}
                  onCancel={cancelGeneration}
                  messages={loaderMessages}
                />
              ) : loadedCode ? (
                (() => {
                  const files = buildFilesForSandpack(loadedCode.code);
                  const sandpackTheme = theme === "dark" ? amethyst : aquaBlue;
                  return (
                    <div>
                      <SandpackProvider
                        template="react-ts"
                        files={files}
                        customSetup={{
                          dependencies: {
                            react: "^18.2.0",
                            "react-dom": "^18.2.0",
                            "react-router-dom": "^6.23.1",
                            clsx: "^2.1.1",
                            "tailwind-merge": "^2.3.0",
                            "lucide-react": "^0.379.0",
                          },
                        }}
                        theme={sandpackTheme}
                        options={{
                          externalResources: [],
                          bundlerURL: undefined,
                          activeFile: "/src/App.tsx",
                        }}
                      >
                        <div className="flex-1 rounded-xl border border-border/60 bg-card/70 shadow-sm overflow-hidden">
                          <div className="px-4 py-2 flex items-center justify-between text-xs text-muted-foreground border-b border-border/60 bg-background/80">
                            <span className="truncate">
                              📄 {loadedCode.filename}
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={retryPreview}
                                aria-label="Reintentar previsualización"
                                title="Reintentar"
                                className="text-primary"
                                disabled={isGenerating}
                              >
                                <RotateCcw
                                  className={`size-4 ${
                                    isGenerating ? "animate-spin" : ""
                                  }`}
                                />
                              </Button>
                              <SandpackUrlButton />
                            </div>
                          </div>
                          <SandpackRunner />
                        </div>
                      </SandpackProvider>
                    </div>
                  );
                })()
              ) : (
                <div className="rounded-xl border border-border/60 p-6 text-sm text-muted-foreground shadow-sm flex items-center justify-center">
                  <p className="text-center">
                    Completa el formulario y presiona "Continuar" para ver la
                    previsualización.
                  </p>
                </div>
              )
            ) : previewMode === "webcontainer" ? (
              isGenerating ? (
                <DynamicWebContainerPreview
                  projectData={{
                    name: projectName,
                    description: oneLiner,
                  }}
                  env={previewEnv}
                  onCodeLoaded={handleCodeLoadedForMode("webcontainer")}
                  onCancel={cancelGeneration}
                  messages={loaderMessages}
                />
              ) : loadedCode ? (
                <div>
                  <div className="flex-1">
                    <WebContainerPreview
                      code={loadedCode.code}
                      extras={loadedCode.extras}
                      onRetry={retryPreview}
                      isGenerating={isGenerating}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 p-6 text-sm text-muted-foreground shadow-sm flex items-center justify-center">
                  <p className="text-center">
                    Completa el formulario y presiona "Continuar" para ver la
                    previsualización.
                  </p>
                </div>
              )
            ) : null}
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

function App() {
  return (
    <SidebarProvider>
      <AppContent />
    </SidebarProvider>
  );
}

export default App;
