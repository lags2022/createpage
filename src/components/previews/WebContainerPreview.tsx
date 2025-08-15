import * as React from "react";
import type { WebContainer, WebContainerProcess, FileSystemTree } from "@webcontainer/api";
import { getWebContainer, acquireWebContainer, releaseWebContainer } from "@/lib/webcontainerManager";
import { buildFilesForSandpack } from "../../lib/sandpackFiles";

interface WebContainerPreviewProps {
  code: string;
  className?: string;
}

export function WebContainerPreview({ code, className }: WebContainerPreviewProps) {
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const [status, setStatus] = React.useState<
    "booting" | "mounting" | "installing" | "starting" | "ready" | "error"
  >("booting");
  const [error, setError] = React.useState<string | null>(null);
  const [logs, setLogs] = React.useState<string>("");

  const wcRef = React.useRef<WebContainer | null>(null);
  const procRef = React.useRef<WebContainerProcess | null>(null);
  const logsRef = React.useRef<HTMLDivElement | null>(null);
  const [wrapLines, setWrapLines] = React.useState(true);
  const [autoScroll, setAutoScroll] = React.useState(true);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [serverPort, setServerPort] = React.useState<number | null>(null);
  const [routePath, setRoutePath] = React.useState<string>("/");
  const [pendingPath, setPendingPath] = React.useState<string>("/");

  function cleanLog(input: string): string {
    // Elimina códigos ANSI y normaliza saltos de línea (usar \u001B para evitar control chars en el código fuente)
    // eslint-disable-next-line no-control-regex
    const ansi = /\u001B\[[0-?]*[ -/]*[@-~]/g;
    return input.replace(ansi, "").replace(/\r\n?/g, "\n");
  }

  function normalizeRoutePath(p: string): string {
    const raw = p.trim();
    if (!raw) return "/";
    return raw.startsWith("/") ? raw : `/${raw}`;
  }

  function makeFullUrl(baseUrl: string, path: string): string {
    try {
      return new URL(normalizeRoutePath(path), baseUrl).toString();
    } catch {
      return baseUrl;
    }
  }

  React.useEffect(() => {
    let cancelled = false;

    async function ensureCOI() {
      // Intenta registrar el COI service worker si no hay COI.
      if (!globalThis.crossOriginIsolated && "serviceWorker" in navigator) {
        try {
          // @ts-expect-error - carga dinámica del SW externo
          await import("https://unpkg.com/coi-serviceworker/coi-serviceworker.min.js");
        } catch (e) {
          // noop: si falla, el modo no será COI y mostraremos un mensaje de error luego
          console.debug("COI SW no pudo registrarse", e);
        }
      }
    }

    function appendLog(chunk: string) {
      const cleaned = cleanLog(chunk);
      setLogs((prev) => (prev + cleaned).slice(-20000));
    }

    async function streamOutput(proc: WebContainerProcess) {
      const reader = proc.output.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // value puede ser string o Uint8Array según el runtime/TS defs
          if (typeof value === "string") {
            appendLog(value);
          } else if (value) {
            appendLog(decoder.decode(value));
          }
        }
      } catch (e) {
        console.debug("streamOutput terminó con error", e);
      }
    }

    function toFsTree(files: Record<string, { code: string }>): FileSystemTree {
      const tree: FileSystemTree = {};
      for (const [fullPath, { code }] of Object.entries(files)) {
        const parts = fullPath.split("/").filter(Boolean);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let cursor: Record<string, any> = tree as unknown as Record<string, any>;
        for (let i = 0; i < parts.length; i++) {
          const isFile = i === parts.length - 1;
          const part = parts[i];
          if (isFile) {
            cursor[part] = { file: { contents: code } };
          } else {
            cursor[part] = cursor[part] || { directory: {} };
            cursor = cursor[part].directory;
          }
        }
      }
      return tree;
    }

    async function boot() {
      try {
        setStatus("booting");
        setError(null);
        await ensureCOI();
        // Gestiona instancia única de WebContainer
        acquireWebContainer();
        const wc = await getWebContainer();
        if (cancelled) return;
        wcRef.current = wc;

        setStatus("mounting");
        const files = buildFilesForSandpack(code);
        // Para WebContainers evitamos CSS externo (COEP). Limpiamos el @import remoto si existe.
        const idxCss = files["/src/index.css"];
        if (idxCss) {
          const cleaned = idxCss.code
            .split("\n")
            .filter((ln) => !/cdn\.jsdelivr\.net.*tailwind/i.test(ln))
            .join("\n");
          files["/src/index.css"] = { code: cleaned };
        }
        const fsTree = toFsTree(files);
        await wc.mount(fsTree);
        if (cancelled) return;

        setStatus("installing");
        const install = await wc.spawn("npm", ["install"]);
        streamOutput(install);
        const installExitCode = await install.exit;
        if (cancelled) return;
        if (installExitCode !== 0) {
          throw new Error("npm install falló dentro de WebContainer");
        }

        setStatus("starting");
        wc.on("server-ready", (_port, url) => {
          if (cancelled) return;
          setPreviewUrl(url);
          setServerPort(_port);
          setRoutePath("/");
          setPendingPath("/");
          setStatus("ready");
        });

        const dev = await wc.spawn("npm", ["run", "dev"]);
        procRef.current = dev;
        streamOutput(dev);
        // Mantener el proceso corriendo; no esperamos exit.
        await dev.exit;
      } catch (err) {
        if (cancelled) return;
        console.error("WebContainer error:", err);
        setStatus("error");
        const msg = err instanceof Error ? err.message : String(err);
        setError(
          msg.includes("cross-origin isolated") || msg.includes("SharedArrayBuffer")
            ? "Tu navegador no está en modo cross-origin isolated (COOP/COEP). Intenta recargar esta página; si el problema persiste, usa los modos sandpack o iframe."
            : `No se pudo iniciar WebContainers: ${msg}`,
        );
      }
    }

    boot();

    return () => {
      cancelled = true;
      try {
        procRef.current?.kill();
      } catch (e) {
        console.debug("proc kill falló", e);
      }
      // Liberar la instancia global si nadie más la usa
      setPreviewUrl(null);
      releaseWebContainer();
    };
  }, [code]);

  React.useEffect(() => {
    if (autoScroll && logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  React.useEffect(() => {
    if (status === "ready" && previewUrl && iframeRef.current) {
      const raw = routePath.trim();
      const normalized = raw ? (raw.startsWith("/") ? raw : `/${raw}`) : "/";
      try {
        const url = new URL(normalized, previewUrl).toString();
        iframeRef.current.src = url;
      } catch {
        iframeRef.current.src = previewUrl;
      }
    }
  }, [status, previewUrl, routePath]);

  const currentStep =
    status === "booting" ? 0 :
    status === "mounting" ? 1 :
    status === "installing" ? 2 :
    status === "starting" ? 3 : 4;

  const fullUrl = previewUrl ? makeFullUrl(previewUrl, routePath) : null;

  return (
    <div className={`flex flex-col h-full ${className ?? ""}`}>
      <div className="p-4 mx-auto w-full">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {["Arrancando", "Montando FS", "Instalando deps", "Levantando server", "Listo"].map((label, idx) => (
            <span
              key={label}
              className={`px-2 py-[2px] rounded border ${idx <= currentStep ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border/60"}`}
            >
              {label}
            </span>
          ))}
          <span className="ml-auto">
            {fullUrl ? (
              <>
                URL: <a href={fullUrl} target="_blank" rel="noreferrer" className="underline">{fullUrl}</a>
              </>
            ) : (
              "Preparando vista previa..."
            )}
          </span>
        </div>

        {/* Barra de dirección */}
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Ruta</span>
          <input
            aria-label="Ruta del preview"
            className="flex-1 max-w-sm px-2 py-1 rounded border border-border/60 bg-background"
            placeholder="/"
            value={pendingPath}
            onChange={(e) => setPendingPath(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setRoutePath(normalizeRoutePath(pendingPath));
            }}
            disabled={!previewUrl}
          />
          <button
            type="button"
            className="px-2 py-1 rounded border border-border/60 bg-background hover:bg-muted text-xs"
            onClick={() => setRoutePath(normalizeRoutePath(pendingPath))}
            disabled={!previewUrl}
          >
            Ir
          </button>
          <button
            type="button"
            className="px-2 py-1 rounded border border-border/60 bg-background hover:bg-muted text-xs"
            onClick={() => {
              if (iframeRef.current && fullUrl) {
                const u = new URL(fullUrl);
                u.searchParams.set("_ts", Date.now().toString());
                iframeRef.current.src = u.toString();
              }
            }}
            disabled={!previewUrl}
          >
            Recargar
          </button>
          {serverPort !== null && (
            <span className="ml-auto text-xs text-muted-foreground">puerto: {serverPort}</span>
          )}
        </div>

        <div className="rounded-xl border border-border/60 bg-card/70 shadow-sm overflow-hidden h-[60vh] min-h-[360px]">
          {status === "ready" ? (
            <iframe ref={iframeRef} title="WebContainer Preview" className="w-full h-full" />
          ) : (
            <div className="p-6 text-sm text-muted-foreground h-full grid place-items-center text-center">
              <div>
                <div className="mb-1 font-medium">
                  {status === "booting" && "Inicializando WebContainers..."}
                  {status === "mounting" && "Montando sistema de archivos..."}
                  {status === "installing" && "Instalando dependencias (npm install)..."}
                  {status === "starting" && "Iniciando Vite (npm run dev)..."}
                  {status === "error" && "Ocurrió un error"}
                </div>
                {error ? (
                  <div className="text-destructive">{error}</div>
                ) : (
                  <div className="text-xs opacity-80">
                    {status === "installing"
                      ? "La primera vez puede tardar 20–60s."
                      : "Esto tomará solo unos segundos."}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs">
          <button
            type="button"
            className="px-2 py-1 rounded border border-border/60 bg-background hover:bg-muted"
            onClick={() => setWrapLines((v) => !v)}
          >
            Ajuste: {wrapLines ? "activado" : "desactivado"}
          </button>
          <button
            type="button"
            className="px-2 py-1 rounded border border-border/60 bg-background hover:bg-muted"
            onClick={() => setAutoScroll((v) => !v)}
          >
            Auto-scroll: {autoScroll ? "activado" : "desactivado"}
          </button>
          <button
            type="button"
            className="px-2 py-1 rounded border border-border/60 bg-background hover:bg-muted"
            onClick={() => setLogs("")}
          >
            Limpiar logs
          </button>
          {fullUrl && (
            <>
              <button
                type="button"
                className="ml-auto px-2 py-1 rounded border border-border/60 bg-background hover:bg-muted"
                onClick={() => {
                  try {
                    if (fullUrl) {
                      void navigator.clipboard?.writeText(fullUrl);
                    }
                  } catch (e) {
                    console.debug("No se pudo copiar URL", e);
                  }
                }}
              >
                Copiar URL
              </button>
              <a
                className="px-2 py-1 rounded border border-border/60 bg-background hover:bg-muted"
                href={fullUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir en pestaña
              </a>
            </>
          )}
        </div>

        <div
          ref={logsRef}
          className={`mt-3 rounded-lg border bg-background/70 p-2 text-xs text-muted-foreground max-h-48 ${wrapLines ? "whitespace-pre-wrap break-words" : "whitespace-pre overflow-x-auto"} overflow-auto font-mono`}
        >
          {logs || "Logs de instalación/arranque aparecerán aquí..."}
        </div>
      </div>
    </div>
  );
}
