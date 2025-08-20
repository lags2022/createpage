import * as React from "react";
import type {
  WebContainer,
  WebContainerProcess,
  FileSystemTree,
} from "@webcontainer/api";
import {
  getWebContainer,
  acquireWebContainer,
  releaseWebContainer,
} from "@/lib/webcontainerManager";
import { idbGet, idbSet } from "@/lib/idb";
import { WcFileExplorer } from "./WcFileExplorer";

import { buildFilesForWebContainerMore } from "@/lib/webcontainerMoreFiles";
import type { DynamicFileEntry } from "@/lib/webcontainerMoreFiles";

interface WebContainerPreviewProps {
  code: string;
  extras?: DynamicFileEntry[];
  className?: string;
  onRetry?: () => void;
  isGenerating?: boolean;
}

export function WebContainerPreview({ code, extras, className, onRetry, isGenerating = false }: WebContainerPreviewProps) {
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
  // const [serverPort, setServerPort] = React.useState<number | null>(null);
  const [routePath, setRoutePath] = React.useState<string>("/");
  const [pendingPath, setPendingPath] = React.useState<string>("/");
  const [useSnapshot, setUseSnapshot] = React.useState(true);
  const [snapshotUsed, setSnapshotUsed] = React.useState(false);
  const [cacheKey, setCacheKey] = React.useState<string | null>(null);
  // Mantener el valor actual de useSnapshot para usarlo dentro del efecto de boot sin requerir dependencia
  const useSnapshotRef = React.useRef(useSnapshot);
  React.useEffect(() => {
    useSnapshotRef.current = useSnapshot;
  }, [useSnapshot]);
  // Control de readiness y timeout compartido entre eventos y logs
  const readyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const alreadyReadyRef = React.useRef(false);
  // Ref para cacheKey y evitar dependencia del efecto
  const cacheKeyRef = React.useRef<string | null>(null);
  const [bootStartAt, setBootStartAt] = React.useState<number | null>(null);
  const [elapsedTotal, setElapsedTotal] = React.useState<number>(0);
  const [fileExplorerOpen, setFileExplorerOpen] = React.useState(false);
  // Captura del código y extras iniciales para booteo único; actualizaciones se aplican en efecto separado
  const initialCodeRef = React.useRef(code);
  const initialExtrasRef = React.useRef(extras);

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
    // Importante: preservamos search y hash del baseUrl (contienen tokens de sesión de WebContainer)
    try {
      const u = new URL(baseUrl);
      u.pathname = normalizeRoutePath(path);
      return u.toString();
    } catch {
      return baseUrl;
    }
  }

  // Hash simple y determinista para claves de snapshot
  function djb2Hash(str: string): string {
    let h = 5381 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0;
    }
    return (h >>> 0).toString(16);
  }

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (bootStartAt !== null && status !== "ready" && status !== "error") {
      interval = setInterval(() => {
        setElapsedTotal(Math.floor((Date.now() - bootStartAt) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [bootStartAt, status]);

  React.useEffect(() => {
    let cancelled = false;

    async function ensureCOI() {
      // Intenta registrar el COI service worker si no hay COI.
      if (!globalThis.crossOriginIsolated && "serviceWorker" in navigator) {
        const injectScript = (src: string) =>
          new Promise<void>((res, rej) => {
            if (document.querySelector(`script[src='${src}']`)) return res();
            const s = document.createElement("script");
            s.type = "module";
            s.src = src;
            s.onload = () => res();
            s.onerror = () => rej();
            document.head.appendChild(s);
          });
        try {
          await injectScript("/coi-serviceworker.min.js");
        } catch (eLocal) {
          console.debug("COI SW local no pudo cargarse", eLocal);
        }
      }
    }

    function appendLog(chunk: string) {
      const cleaned = cleanLog(chunk);
      setLogs((prev) => (prev + cleaned).slice(-20000));
    }

    function maybeMarkReadyFromLogs(chunk: string) {
      if (alreadyReadyRef.current) return;
      const text = cleanLog(chunk);
      // Detectar URL publicable de WebContainer
      const urlMatch = text.match(/https?:\/\/[\w.-]*webcontainer\.io[^\s]*/i);
      if (urlMatch && !alreadyReadyRef.current) {
        if (readyTimeoutRef.current) {
          clearTimeout(readyTimeoutRef.current);
          readyTimeoutRef.current = null;
        }
        alreadyReadyRef.current = true;
        setPreviewUrl(urlMatch[0]);
        setStatus("ready");
        setBootStartAt(null);
        // Guardar snapshot en segundo plano si aplica
        const keyRef = cacheKeyRef.current;
        if (useSnapshotRef.current && keyRef) {
          const wc = wcRef.current;
          if (wc) {
            void (async () => {
              try {
                const snap = await wc.export("json");
                await idbSet(keyRef, snap as unknown as FileSystemTree);
              } catch (e) {
                console.debug("No se pudo exportar snapshot (fallback logs)", e);
              }
            })();
          }
        }
        return;
      }
      // Señales de Vite "ready" sin URL: acortar timeout a 5s para fallar antes si no hay URL
      if (/ready in \d+\s?ms|Local:\s|Network:\s/i.test(text)) {
        if (!alreadyReadyRef.current) {
          if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
          readyTimeoutRef.current = setTimeout(() => {
            if (alreadyReadyRef.current) return;
            setStatus("error");
            setError("Vite parece listo, pero no expuso una URL accesible. Revisa los logs.");
            try {
              procRef.current?.kill();
            } catch (e) {
              console.debug("proc kill tras fallback de logs", e);
            }
          }, 5000);
        }
      }
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
            maybeMarkReadyFromLogs(value);
          } else if (value) {
            const txt = decoder.decode(value);
            appendLog(txt);
            maybeMarkReadyFromLogs(txt);
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
        let cursor: Record<string, any> = tree as unknown as Record<
          string,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          any
        >;
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
        setBootStartAt(Date.now());
        setElapsedTotal(0);
        await ensureCOI();
        // Gestiona instancia única de WebContainer
        acquireWebContainer();
        const wc = await getWebContainer();
        if (cancelled) return;
        wcRef.current = wc;

        // Construir archivos base y clave del snapshot
        // Siempre usamos buildFilesForWebContainerMore para garantizar
        // que existan /src/main.tsx y /src/index.css (fallbacks incluidos)
        const files = buildFilesForWebContainerMore(
          initialExtrasRef.current ?? [],
          initialCodeRef.current
        );
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
        const pkgSource = files["/package.json"]?.code ?? "";
        const lockSource = files["/package-lock.json"]?.code ?? "";
        const key = `wc:snap:${djb2Hash(pkgSource + "|" + lockSource)}`;
        setCacheKey(key);
        cacheKeyRef.current = key;

        setStatus("mounting");
        let usedSnap = false;
        if (useSnapshotRef.current) {
          try {
            const snap = await idbGet<FileSystemTree>(key);
            if (snap) {
              await wc.mount(snap);
              usedSnap = true;
            } else {
              await wc.mount(fsTree);
            }
          } catch {
            await wc.mount(fsTree);
          }
        } else {
          await wc.mount(fsTree);
        }
        if (cancelled) return;
        setSnapshotUsed(usedSnap);

        if (!usedSnap) {
          setStatus("installing");
          let usedCi = false;
          // Intentar usar npm ci si hay package-lock.json montado
          try {
            await wc.fs.readFile("/package-lock.json", "utf-8");
            const ci = await wc.spawn("npm", [
              "ci",
              "--no-audit",
              "--no-fund",
              "--loglevel=warn",
            ]);
            streamOutput(ci);
            const codeCi = await ci.exit;
            if (cancelled) return;
            if (codeCi === 0) {
              usedCi = true;
            }
          } catch {
            // no lockfile o error al leerlo -> continuar a install
          }

          if (!usedCi) {
            const install = await wc.spawn("npm", [
              "install",
              "--no-audit",
              "--no-fund",
              "--loglevel=warn",
            ]);
            streamOutput(install);
            const installExitCode = await install.exit;
            if (cancelled) return;
            if (installExitCode !== 0) {
              throw new Error("npm install falló dentro de WebContainer");
            }
          }
        }

        // Instalar dependencias adicionales requeridas por extras si no están en package.json
        try {
          const extrasList = initialExtrasRef.current ?? [];
          if (extrasList.length > 0) {
            const declared = await (async () => {
              try {
                const pkgStr = await wc.fs.readFile("/package.json", "utf-8");
                const pkg = JSON.parse(String(pkgStr) || "{}") as {
                  dependencies?: Record<string, string>;
                  devDependencies?: Record<string, string>;
                };
                return new Set([
                  ...Object.keys(pkg.dependencies ?? {}),
                  ...Object.keys(pkg.devDependencies ?? {}),
                ]);
              } catch {
                try {
                  const pkg = JSON.parse(pkgSource || "{}") as {
                    dependencies?: Record<string, string>;
                    devDependencies?: Record<string, string>;
                  };
                  return new Set([
                    ...Object.keys(pkg.dependencies ?? {}),
                    ...Object.keys(pkg.devDependencies ?? {}),
                  ]);
                } catch {
                  return new Set<string>();
                }
              }
            })();
            const wanted = new Set<string>();
            const addSpec = (raw: string) => {
              if (!raw) return;
              if (raw.startsWith(".") || raw.startsWith("/")) return; // rutas locales
              if (raw.includes("://")) return; // URL absoluta
              if (raw.startsWith("node:") || raw.startsWith("data:") || raw.startsWith("vite:") || raw.startsWith("virtual:")) return; // esquemas especiales
              if (raw.startsWith("#")) return; // import maps con ancla
              let name = raw;
              if (raw.startsWith("@")) {
                const parts = raw.split("/");
                if (parts.length >= 2) name = `${parts[0]}/${parts[1]}`;
              } else {
                name = raw.split("/")[0];
              }
              if (!declared.has(name)) wanted.add(name);
            };
            for (const e of extrasList) {
              const c = String((e as unknown as { code?: string })?.code ?? "");
              // import ... from 'pkg'
              const reFrom = /from\s+['"]([^'")]+)['"]/g; let m: RegExpExecArray | null;
              while ((m = reFrom.exec(c))) addSpec(m[1]);
              // import('pkg')
              const reDyn = /import\(\s*['"]([^'")]+)['"]\s*\)/g; let m2: RegExpExecArray | null;
              while ((m2 = reDyn.exec(c))) addSpec(m2[1]);
              // require('pkg')
              const reReq = /require\(\s*['"]([^'")]+)['"]\s*\)/g; let m3: RegExpExecArray | null;
              while ((m3 = reReq.exec(c))) addSpec(m3[1]);
            }
            const toInstall = Array.from(wanted);
            if (toInstall.length > 0) {
              const installExtra = await wc.spawn("npm", [
                "install",
                ...toInstall,
                "--no-audit",
                "--no-fund",
                "--loglevel=warn",
              ]);
              streamOutput(installExtra);
              const codeExtra = await installExtra.exit;
              if (cancelled) return;
              if (codeExtra !== 0) {
                throw new Error(`npm install de extras falló: ${toInstall.join(", ")}`);
              }
            }
          }
        } catch (e) {
          console.debug("Instalación condicional de extras falló (continuando)", e);
        }

        // Asegurar que el código fuente actual se aplique (por si el snapshot existe pero el código cambió)
        try {
          await wc.fs.writeFile("/src/App.tsx", files["/src/App.tsx"].code);
          if (files["/src/index.css"]) {
            await wc.fs.writeFile(
              "/src/index.css",
              files["/src/index.css"].code
            );
          }
        } catch (e) {
          console.debug("No se pudo aplicar parches de código", e);
        }

        // Temporizador de seguridad: si Vite no emite "server-ready" en tiempo, fallar con mensaje claro
        setStatus("starting");
        wc.on("server-ready", (_port, url) => {
          if (cancelled) return;
          if (readyTimeoutRef.current) {
            clearTimeout(readyTimeoutRef.current);
            readyTimeoutRef.current = null;
          }
          alreadyReadyRef.current = true;
          setPreviewUrl(url);
          // setServerPort(_port);
          // Mantener ruta previa (persistida)
          // setRoutePath("/");
          // setPendingPath("/");
          setStatus("ready");
          setBootStartAt(null); // detener timer
          // Guardar snapshot en segundo plano
          if (useSnapshotRef.current) {
            void (async () => {
              try {
                const snap = await wc.export("json");
                await idbSet(key, snap as unknown as FileSystemTree);
              } catch (e) {
                console.debug("No se pudo exportar snapshot", e);
              }
            })();
          }
        });

        const dev = await wc.spawn("npm", ["run", "dev"]);
        procRef.current = dev;
        streamOutput(dev);
        // Programar timeout si no llega "server-ready" en 30s
        readyTimeoutRef.current = setTimeout(() => {
          if (cancelled) return;
          setStatus("error");
          setError("El servidor de desarrollo no respondió a tiempo. Revisa los logs de Vite.");
          try {
            procRef.current?.kill();
          } catch (e) {
            console.debug("proc kill tras timeout", e);
          }
        }, 30000);

        // Mantener el proceso corriendo; no esperamos exit. Si termina, informamos.
        void dev.exit
          .then((code) => {
            if (cancelled) return;
            if (code !== 0) {
              setStatus("error");
              setError(`El servidor de desarrollo se detuvo con código ${code}.`);
            }
          })
          .catch((e) => {
            if (cancelled) return;
            setStatus("error");
            setError(
              `El servidor de desarrollo terminó con error: ${e instanceof Error ? e.message : String(e)}`
            );
          });
      } catch (err) {
        if (cancelled) return;
        console.error("WebContainer error:", err);
        setStatus("error");
        const msg = err instanceof Error ? err.message : String(err);
        setError(
          msg.includes("cross-origin isolated") ||
            msg.includes("SharedArrayBuffer")
            ? "Tu navegador no está en modo cross-origin isolated (COOP/COEP). Intenta recargar esta página; si el problema persiste, usa los modos sandpack o iframe."
            : `No se pudo iniciar WebContainers: ${msg}`
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
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
        readyTimeoutRef.current = null;
      }
      releaseWebContainer();
    };
  }, []);

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
        const u = new URL(previewUrl);
        u.pathname = normalized;
        iframeRef.current.src = u.toString();
      } catch {
        iframeRef.current.src = previewUrl;
      }
    }
  }, [status, previewUrl, routePath]);

  // Aplicar actualizaciones de código y archivos extra sin reiniciar el contenedor
  React.useEffect(() => {
    const wc = wcRef.current;
    if (!wc) return;
    if (status !== "ready") return;
    let cancelled = false;
    async function applyUpdates(w: WebContainer) {
      try {
        // Actualizar /src/App.tsx con el nuevo código
        await w.fs.writeFile("/src/App.tsx", code);
        // Escribir archivos extra si se proporcionan
        if (extras && extras.length) {
          for (const entry of extras) {
            // Aceptar varias formas de ruta y normalizar
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const anyEntry = entry as any;
            const rawPath: unknown = (entry && (entry.path as unknown))
              ?? anyEntry?.file
              ?? anyEntry?.["path "]
              ?? anyEntry?.Path
              ?? anyEntry?.PATH;
            if (typeof rawPath !== "string" || !rawPath.trim()) continue;
            const normalized = (rawPath.startsWith("/") ? rawPath : `/${rawPath}`).replace(/\\+/g, "/");
            const rawCode: unknown = (entry && (entry.code as unknown)) ?? anyEntry?.contents ?? anyEntry?.content;
            if (typeof rawCode !== "string") continue;
            await w.fs.writeFile(normalized, rawCode);
          }
        }
      } catch (e) {
        if (!cancelled) console.debug("No se pudo aplicar actualización de código", e);
      }
    }
    void applyUpdates(wc);
    return () => {
      cancelled = true;
    };
  }, [code, extras, status]);

  // Persistir ruta del preview en localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("wc:route");
      if (saved) {
        const normalized = normalizeRoutePath(saved);
        setRoutePath(normalized);
        setPendingPath(normalized);
      }
    } catch {
      // noop
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem("wc:route", routePath);
    } catch {
      // noop
    }
  }, [routePath]);

  const currentStep =
    status === "booting"
      ? 0
      : status === "mounting"
      ? 1
      : status === "installing"
      ? 2
      : status === "starting"
      ? 3
      : 4;

  const fullUrl = previewUrl ? makeFullUrl(previewUrl, routePath) : null;

  return (
    <div className={`flex flex-col h-full ${className ?? ""}`}>
      <div className="mx-auto w-full">
        {/* Línea de progreso con controles integrados */}
        <div className="mb-2 flex items-center justify-between text-xs">
          {/* Pasos de progreso */}
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
            {[
              "Arrancando",
              "Montando FS",
              useSnapshot ? "Retomando imagen" : "Instalando deps",
              "Levantando server",
              "Listo",
            ].map((label, idx) => (
              <span
                key={`${label}-${idx}`}
                className={`px-2 py-[2px] rounded border ${idx <= currentStep ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border/60"}`}
              >
                {label}
                {idx === currentStep && status !== "ready" && status !== "error" && elapsedTotal > 0 && (
                  <span className="ml-1 text-xs opacity-75">({elapsedTotal}s)</span>
                )}
              </span>
            ))}
          </div>
          
          {/* Controles de navegación */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-2 py-1 rounded border border-border/60 bg-background hover:bg-muted text-xs"
              onClick={() => setFileExplorerOpen(true)}
              disabled={!wcRef.current}
            >
              Archivos
            </button>
            <input
              aria-label="Ruta del preview"
              className="w-20 px-2 py-1 rounded border border-border/60 bg-background text-xs"
              placeholder="/"
              value={pendingPath}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPendingPath(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter")
                  setRoutePath(normalizeRoutePath(pendingPath));
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
              ⟳
            </button>
            {onRetry && (
              <button
                type="button"
                className="px-2 py-1 rounded border border-border/60 bg-background hover:bg-muted text-xs text-primary"
                onClick={onRetry}
                disabled={isGenerating}
                title="Reintentar previsualización"
              >
                <span className={`${isGenerating ? "animate-spin" : ""}`}>↻</span>
              </button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/70 shadow-sm overflow-hidden h-[calc(100dvh-118px)] min-h-[360px]">
          {status === "ready" ? (
            <iframe
              ref={iframeRef}
              title="WebContainer Preview"
              className="w-full h-full"
            />
          ) : (
            <div className="p-6 text-sm text-muted-foreground h-full grid place-items-center text-center">
              <div>
                <div className="mb-1 font-medium">
                  {status === "booting" && "Inicializando WebContainers..."}
                  {status === "mounting" &&
                    (snapshotUsed
                      ? "Retomando imagen desde caché..."
                      : useSnapshot
                      ? "Buscando imagen en caché..."
                      : "Montando sistema de archivos...")}
                  {status === "installing" &&
                    (snapshotUsed
                      ? "Aplicando cambios..."
                      : "Instalando dependencias (npm install)...")}
                  {status === "starting" && "Iniciando Vite (npm run dev)..."}
                  {status === "error" && "Ocurrió un error"}
                </div>
                {error ? (
                  <div className="text-destructive">{error}</div>
                ) : (
                  <div className="text-xs opacity-80">
                    {status === "installing" && !snapshotUsed
                      ? "La primera vez puede tardar 20–60s."
                      : useSnapshot
                      ? "Mucho más rápido con snapshot."
                      : "Esto tomará solo unos segundos."}
                    {elapsedTotal > 0 && (
                      <div className="mt-1 text-primary font-mono">
                        Tiempo transcurrido: {elapsedTotal}s
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* <div
          ref={logsRef}
          className={`mt-3 rounded-lg border bg-background/70 p-2 text-xs text-muted-foreground max-h-40 ${wrapLines ? "whitespace-pre-wrap break-words" : "whitespace-pre overflow-x-auto"} overflow-auto font-mono`}
        >
          {logs || "Logs de instalación/arranque aparecerán aquí..."}
        </div> */}
        {/* Explorador de archivos */}
        <WcFileExplorer
          wc={wcRef.current}
          open={fileExplorerOpen}
          onOpenChange={setFileExplorerOpen}
          initialPath="/"
          logs={logs}
          wrapLines={wrapLines}
          autoScroll={autoScroll}
          onWrapLinesChange={setWrapLines}
          onAutoScrollChange={setAutoScroll}
          onClearLogs={() => setLogs("")}
          useSnapshot={useSnapshot}
          onUseSnapshotChange={setUseSnapshot}
          snapshotUsed={snapshotUsed}
          cacheKey={cacheKey}
          fullUrl={fullUrl}
        />
      </div>
    </div>
  );
}
