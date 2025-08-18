import * as React from "react";
import type { WebContainer } from "@webcontainer/api";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronRight,
  File as FileIcon,
  Folder as FolderIcon,
  RefreshCw,
  Save,
  RotateCcw,
  FilePlus,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";

// Función para detectar el tipo de archivo
function getFileLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js': case 'jsx': return 'javascript';
    case 'ts': case 'tsx': return 'typescript';
    case 'css': return 'css';
    case 'html': return 'html';
    case 'json': return 'json';
    case 'md': return 'markdown';
    default: return 'text';
  }
}

// Función para validación básica de sintaxis
function getBasicSyntaxErrors(code: string, language: string): Array<{line: number, message: string}> {
  const errors: Array<{line: number, message: string}> = [];
  const lines = code.split('\n');
  
  if (language === 'javascript' || language === 'typescript') {
    let braceCount = 0;
    let bracketCount = 0;
    let parenCount = 0;
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Contar llaves, corchetes y paréntesis
      for (const char of line) {
        switch (char) {
          case '{': braceCount++; break;
          case '}': braceCount--; break;
          case '[': bracketCount++; break;
          case ']': bracketCount--; break;
          case '(': parenCount++; break;
          case ')': parenCount--; break;
        }
      }
      
      // Verificar strings sin cerrar
      const singleQuotes = (line.match(/'/g) || []).length;
      const doubleQuotes = (line.match(/"/g) || []).length;
      if (singleQuotes % 2 !== 0) {
        errors.push({line: lineNum, message: "Comilla simple sin cerrar"});
      }
      if (doubleQuotes % 2 !== 0) {
        errors.push({line: lineNum, message: "Comilla doble sin cerrar"});
      }
      
      // Verificar punto y coma faltante en declaraciones
      if (line.trim().match(/^(const|let|var|return)\s+[^;]*[^;{}\s]\s*$/) && !line.includes('//')) {
        errors.push({line: lineNum, message: "Posible punto y coma faltante"});
      }
    });
    
    // Verificar balanceo global
    if (braceCount !== 0) {
      errors.push({line: lines.length, message: `${braceCount > 0 ? 'Llave de cierre' : 'Llave de apertura'} faltante`});
    }
    if (bracketCount !== 0) {
      errors.push({line: lines.length, message: `${bracketCount > 0 ? 'Corchete de cierre' : 'Corchete de apertura'} faltante`});
    }
    if (parenCount !== 0) {
      errors.push({line: lines.length, message: `${parenCount > 0 ? 'Paréntesis de cierre' : 'Paréntesis de apertura'} faltante`});
    }
  }
  
  if (language === 'json') {
    try {
      JSON.parse(code);
    } catch (e) {
      const match = (e as Error).message.match(/position (\d+)/);
      if (match) {
        const pos = parseInt(match[1]);
        const lineNum = code.substring(0, pos).split('\n').length;
        errors.push({line: lineNum, message: "JSON inválido"});
      } else {
        errors.push({line: 1, message: "Formato JSON incorrecto"});
      }
    }
  }
  
  return errors;
}

// Pequeña ayuda para unir rutas sin duplicar /
function joinPath(base: string, name: string): string {
  if (!base || base === "/") return `/${name}`.replace(/\/+/g, "/");
  return `${base.replace(/\/+$|\/$/, "")}/${name}`.replace(/\/+/g, "/");
}

// Entradas que no queremos listar por defecto
const HIDDEN_DIRS = new Set(["node_modules", ".git", ".cache", ".pnpm-store", ".turbo"]);

export type WcFileExplorerProps = {
  wc: WebContainer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPath?: string; // p.ej. "/src"
  logs?: string;
  wrapLines?: boolean;
  autoScroll?: boolean;
  onWrapLinesChange?: (value: boolean) => void;
  onAutoScrollChange?: (value: boolean) => void;
  onClearLogs?: () => void;
  useSnapshot?: boolean;
  onUseSnapshotChange?: (value: boolean) => void;
  snapshotUsed?: boolean;
  cacheKey?: string | null;
  fullUrl?: string | null;
};

interface FsNode {
  name: string;
  path: string;
  isDir: boolean;
  expanded?: boolean;
  loaded?: boolean;
  children?: FsNode[];
}

interface StatsLike {
  isDirectory: () => boolean;
}

type FsStat = { stat: (p: string) => Promise<StatsLike> };
type FsCrud = {
  writeFile: (p: string, data: string | Uint8Array) => Promise<void>;
  mkdir: (p: string, opts?: { recursive?: boolean }) => Promise<void>;
  rm: (p: string, opts?: { recursive?: boolean }) => Promise<void>;
  rename: (oldP: string, newP: string) => Promise<void>;
};

export function WcFileExplorer({ 
  wc, 
  open, 
  onOpenChange, 
  initialPath = "/",
  logs = "",
  wrapLines = true,
  autoScroll = true,
  onWrapLinesChange,
  onAutoScrollChange,
  onClearLogs,
  useSnapshot = true,
  onUseSnapshotChange,
  snapshotUsed = false,
  cacheKey = null,
  fullUrl = null
}: WcFileExplorerProps) {
  const [rootPath, setRootPath] = React.useState(initialPath);
  const [tree, setTree] = React.useState<FsNode | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [content, setContent] = React.useState<string>("");
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [watchEnabled, setWatchEnabled] = React.useState(false);
  const treeRef = React.useRef<FsNode | null>(null);
  const [renameTarget, setRenameTarget] = React.useState<string | null>(null);
  const [renameInput, setRenameInput] = React.useState<string>("");
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);
  const [opBusy, setOpBusy] = React.useState(false);

  // Cargar raíz al abrir
  React.useEffect(() => {
    if (!open) return;
    if (!wc) return;
    void loadRoot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, wc, rootPath]);

  // Mantener una referencia al árbol actual para el watcher
  React.useEffect(() => {
    treeRef.current = tree;
  }, [tree]);

  async function loadRoot() {
    setLoading(true);
    setError(null);
    try {
      const node = await readDirAsNode(rootPath);
      node.expanded = true;
      setTree(node);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`No se pudo leer el directorio: ${msg}`);
    } finally {
      setLoading(false);
    }
  }
  // Helpers de ruta
  function basename(p: string): string {
    if (p === "/") return "/";
    const parts = p.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? p;
  }
  function dirname(p: string): string {
    if (!p || p === "/") return "/";
    const parts = p.split("/").filter(Boolean);
    parts.pop();
    return "/" + parts.join("/");
  }

  async function getCreateDirPath(): Promise<string> {
    if (!wc) return rootPath;
    if (!selected) return rootPath;
    try {
      const st = await (wc.fs as unknown as FsStat).stat(selected);
      if (st?.isDirectory?.()) return selected;
    } catch {
      // noop
    }
    return dirname(selected);
  }

  async function refreshAfterChange() {
    if (!treeRef.current) {
      await loadRoot();
      return;
    }
    const next = await refreshNode(treeRef.current);
    setTree(next);
  }

  async function createFile() {
    if (!wc) return;
    const name = (globalThis.prompt?.("Nombre del archivo (ej: file.tsx)") || "").trim();
    if (!name) return;
    const dir = await getCreateDirPath();
    const target = joinPath(dir, name);
    try {
      await (wc.fs as unknown as FsCrud).writeFile(target, "");
      await refreshAfterChange();
      setSelected(target);
      await openFile(target);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`No se pudo crear el archivo: ${msg}`);
    }
  }

  async function createFolder() {
    if (!wc) return;
    const name = (globalThis.prompt?.("Nombre de la carpeta") || "").trim();
    if (!name) return;
    const dir = await getCreateDirPath();
    const target = joinPath(dir, name);
    try {
      await (wc.fs as unknown as FsCrud).mkdir(target, { recursive: true });
      await refreshAfterChange();
      setSelected(target);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`No se pudo crear la carpeta: ${msg}`);
    }
  }

  function openRenameDialog(path: string) {
    setRenameTarget(path);
    setRenameInput(basename(path));
  }

  async function confirmRename() {
    if (!wc || !renameTarget) return;
    const newName = renameInput.trim();
    if (!newName) return;
    const newPath = joinPath(dirname(renameTarget), newName);
    setOpBusy(true);
    try {
      await (wc.fs as unknown as FsCrud).rename(renameTarget, newPath);
      if (selected === renameTarget) setSelected(newPath);
      setRenameTarget(null);
      await refreshAfterChange();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`No se pudo renombrar: ${msg}`);
    } finally {
      setOpBusy(false);
    }
  }

  function openDeleteDialog(path: string) {
    setDeleteTarget(path);
  }

  async function confirmDelete() {
    if (!wc || !deleteTarget) return;
    setOpBusy(true);
    try {
      await (wc.fs as unknown as FsCrud).rm(deleteTarget, { recursive: true });
      if (selected === deleteTarget) {
        setSelected(null);
        setContent("");
        setDirty(false);
      }
      setDeleteTarget(null);
      await refreshAfterChange();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`No se pudo eliminar: ${msg}`);
    } finally {
      setOpBusy(false);
    }
  }

  async function readDirAsNode(dirPath: string): Promise<FsNode> {
    const node: FsNode = { name: dirPath === "/" ? "/" : dirPath.split("/").pop() || dirPath, path: dirPath, isDir: true };
    if (!wc) return node;

    try {
      // Lectura fiable: siempre readdir + stat para tipo
      const names = await wc.fs.readdir(dirPath as string) as unknown as string[];
      const seen = new Set<string>();
      const childrenPromises = names
        .filter((n) => typeof n === "string" && n !== "." && n !== "..")
        .map(async (name) => {
          const full = joinPath(dirPath, name);
          if (seen.has(full) || HIDDEN_DIRS.has(name)) return null;
          seen.add(full);
          try {
            const st = (await (wc.fs as unknown as FsStat).stat(full)) as StatsLike;
            const isDir = typeof st?.isDirectory === "function" ? st.isDirectory() : false;
            return { name, path: full, isDir } as FsNode;
          } catch {
            // Si stat falla, heurística básica
            const isDir = !/\.[a-zA-Z0-9]+$/.test(name);
            return { name, path: full, isDir } as FsNode;
          }
        });
      const temp = (await Promise.all(childrenPromises)).filter(Boolean) as FsNode[];
      const children = temp.sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1));
      // Orden: carpetas primero
      node.children = children;
      node.loaded = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(msg);
    }
    return node;
  }

  // Refresca recursivamente sólo directorios expandidos, preservando expansión
  async function refreshNode(oldNode: FsNode): Promise<FsNode> {
    if (!wc) return oldNode;
    if (!oldNode.isDir) return oldNode;
    if (!oldNode.expanded) return { ...oldNode };

    const loaded = await readDirAsNode(oldNode.path);
    const oldMap = new Map<string, FsNode>((oldNode.children ?? []).map((c) => [c.path, c]));
    const baseChildren = loaded.children ?? [];
    const nextChildren: FsNode[] = [];

    for (const child of baseChildren) {
      const prev = oldMap.get(child.path);
      if (prev && prev.isDir) {
        child.expanded = !!prev.expanded;
        if (child.expanded) {
          const refreshed = await refreshNode(prev);
          nextChildren.push(refreshed);
          continue;
        }
      }
      nextChildren.push(child);
    }

    return { ...loaded, expanded: true, children: nextChildren };
  }

  // Watcher opcional por sondeo: actualiza carpetas expandidas cada 2s
  React.useEffect(() => {
    if (!open || !wc || !watchEnabled) return;
    let cancelled = false;
    let id: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      try {
        if (!treeRef.current) {
          await loadRoot();
          return;
        }
        const nextRoot = await refreshNode(treeRef.current);
        if (!cancelled) setTree(nextRoot);
      } catch {
        // silencioso
      }
    };

    void tick();
    id = setInterval(() => void tick(), 2000);
    return () => {
      cancelled = true;
      if (id) clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, wc, watchEnabled, rootPath]);

  async function toggleDir(n: FsNode) {
    if (!wc) return;
    if (!n.isDir) return;

    // expandir/colapsar
    if (n.expanded) {
      n.expanded = false;
      setTree({ ...(tree as FsNode) });
      setSelected(n.path);
      return;
    }

    // expandir y cargar si hace falta
    if (!n.loaded) {
      try {
        const loaded = await readDirAsNode(n.path);
        n.children = loaded.children;
        n.loaded = true;
      } catch (e) {
        console.error(e);
      }
    }
    n.expanded = true;
    setTree({ ...(tree as FsNode) });
    setSelected(n.path);
  }

  async function openFile(filePath: string) {
    if (!wc) return;
    setSelected(filePath);
    setError(null);
    try {
      // Nota: encoding como string; la API acepta "utf-8"
      type ReadFile = (p: string, enc?: string | { encoding: string }) => Promise<string | Uint8Array>;
      const res = await (wc.fs as unknown as { readFile: ReadFile }).readFile(filePath, "utf-8");
      const txt = typeof res === "string" ? res : new TextDecoder().decode(res);
      setContent(txt);
      setDirty(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`No se pudo leer el archivo: ${msg}`);
      setContent("");
      setDirty(false);
    }
  }

  async function saveFile() {
    if (!wc || !selected) return;
    setSaving(true);
    setError(null);
    try {
      await wc.fs.writeFile(selected, content);
      setDirty(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`No se pudo guardar: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  // Auto-guardado con debounce
  React.useEffect(() => {
    if (!selected) return;
    if (!dirty) return;
    const t = setTimeout(() => {
      void saveFile();
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, content, selected]);

  function FileRow({ node }: { node: FsNode }) {
    const isActive = selected === node.path;
    if (node.isDir) {
      return (
        <div className="select-none">
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-accent",
              node.expanded && "bg-accent/50"
            )}
            onClick={() => void toggleDir(node)}
            title={node.path}
          >
            {node.expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            <FolderIcon className="size-4 text-amber-500" />
            <span className="truncate">{node.name}</span>
          </button>
          {node.expanded && node.children && (
            <div className="ml-5 mt-1">
              {node.children.map((c) => (
                <FileRow key={c.path} node={c} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-accent",
          isActive && "bg-accent"
        )}
        onClick={() => void openFile(node.path)}
        title={node.path}
      >
        <span className="w-4" />
        <FileIcon className="size-4" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        aria-describedby={undefined}
        className="p-0 w-[96vw] sm:w-[90vw] md:w-1/2 lg:w-1/2 xl:w-1/2 md:max-w-[50vw] lg:max-w-[50vw] xl:max-w-[50vw] overflow-x-auto"
      >
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle>Archivos del proyecto</SheetTitle>
        </SheetHeader>
        <div className="h-full grid grid-cols-12">
          {/* Árbol */}
          <div className="col-span-5 lg:col-span-4 border-r min-h-0 flex flex-col">
            <div className="p-2 flex flex-wrap items-center gap-2 border-b">
              <Input
                value={rootPath}
                onChange={(e) => setRootPath(e.target.value || "/")}
                className="h-8"
                placeholder="/"
              />
              <Button variant="outline" size="sm" onClick={() => void loadRoot()} aria-label="Recargar">
                <RefreshCw className="size-4" />
              </Button>
              <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground select-none">
                <input
                  type="checkbox"
                  checked={watchEnabled}
                  onChange={(e) => setWatchEnabled(e.target.checked)}
                />
                Auto
              </label>
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={() => void createFile()}>
                  <FilePlus className="size-4" /> Archivo
                </Button>
                <Button variant="outline" size="sm" onClick={() => void createFolder()}>
                  <FolderPlus className="size-4" /> Carpeta
                </Button>
                {selected && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => openRenameDialog(selected!)}>
                      <Pencil className="size-4" /> Renombrar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(selected!)}>
                      <Trash2 className="size-4" /> Eliminar
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2 text-sm">
              {loading && <div className="text-muted-foreground">Cargando...</div>}
              {error && <div className="text-destructive mb-2">{error}</div>}
              {tree ? <FileRow node={tree} /> : !loading && <div className="text-muted-foreground">Sin datos</div>}
            </div>
          </div>

          {/* Editor */}
          <div className="col-span-7 lg:col-span-8 min-h-0 flex flex-col">
            <div className="p-2 border-b flex items-center gap-2 text-sm">
              <div className="truncate text-muted-foreground flex-1">
                {selected ?? "Selecciona un archivo"}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selected && void openFile(selected)}
                disabled={!selected}
                aria-label="Revertir desde disco"
              >
                <RotateCcw className="size-4 mr-1" /> Revertir
              </Button>
              <Button
                size="sm"
                onClick={() => void saveFile()}
                disabled={!selected || saving || !dirty}
              >
                <Save className="size-4 mr-1" /> Guardar
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              {selected ? (
                <div className="relative w-full h-full">
                  <textarea
                    spellCheck={false}
                    className="w-full h-full resize-none px-3 py-2 font-mono text-sm bg-background outline-none border-0"
                    style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Inconsolata, "Roboto Mono", Consolas, "Courier New", monospace',
                      lineHeight: '1.5',
                      tabSize: 2
                    }}
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      setDirty(true);
                    }}
                    placeholder="Escribe tu código aquí..."
                  />
                  
                  {/* Indicador de errores de sintaxis simple */}
                  <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border">
                    {getFileLanguage(selected.split('/').pop() || '').toUpperCase()}
                    {content.length > 0 && (
                      <span className="ml-2">
                        {content.split('\n').length} líneas
                      </span>
                    )}
                  </div>
                  
                  {/* Validación básica de sintaxis */}
                  {content && getBasicSyntaxErrors(content, getFileLanguage(selected.split('/').pop() || '')).length > 0 && (
                    <div className="absolute top-0 right-0 mt-2 mr-2 max-w-xs">
                      <div className="bg-destructive/90 text-destructive-foreground text-xs p-2 rounded shadow-lg">
                        <div className="font-medium mb-1">Errores de sintaxis:</div>
                        {getBasicSyntaxErrors(content, getFileLanguage(selected.split('/').pop() || '')).slice(0, 3).map((error, idx) => (
                          <div key={idx} className="text-xs opacity-90">
                            Línea {error.line}: {error.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full grid place-items-center text-sm text-muted-foreground">
                  Abre un archivo desde la izquierda para editarlo.
                </div>
              )}
            </div>
            <div className="p-2 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-3 mb-2">
                <span>
                  {saving ? "Guardando..." : dirty ? "Cambios sin guardar" : "Todo guardado"}
                </span>
              </div>
              {/* Controles de WebContainer */}
              <div className="border-t pt-2 space-y-3">
                {/* Controles de logs */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-xs">Logs de consola:</span>
                    <div className="flex items-center gap-1">
                      {onWrapLinesChange && (
                        <button
                          type="button"
                          className="px-1.5 py-0.5 rounded border border-border/60 bg-background hover:bg-muted text-xs"
                          onClick={() => onWrapLinesChange(!wrapLines)}
                        >
                          Ajuste: {wrapLines ? "on" : "off"}
                        </button>
                      )}
                      {onAutoScrollChange && (
                        <button
                          type="button"
                          className="px-1.5 py-0.5 rounded border border-border/60 bg-background hover:bg-muted text-xs"
                          onClick={() => onAutoScrollChange(!autoScroll)}
                        >
                          Auto: {autoScroll ? "on" : "off"}
                        </button>
                      )}
                      {onClearLogs && (
                        <button
                          type="button"
                          className="px-1.5 py-0.5 rounded border border-border/60 bg-background hover:bg-muted text-xs"
                          onClick={onClearLogs}
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                  </div>
                  <div
                    className={`rounded border bg-background/70 p-2 text-xs text-muted-foreground max-h-32 ${wrapLines ? "whitespace-pre-wrap break-words" : "whitespace-pre overflow-x-auto"} overflow-auto font-mono`}
                  >
                    {logs || "Logs de instalación/arranque aparecerán aquí..."}
                  </div>
                </div>

                {/* Controles de snapshot y caché */}
                <div className="border-t pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-xs">WebContainer:</span>
                    <div className="flex flex-wrap items-center gap-1">
                      {onUseSnapshotChange && (
                        <label className="px-1.5 py-0.5 rounded border border-border/60 bg-background hover:bg-muted cursor-pointer flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={useSnapshot}
                            onChange={(e) => onUseSnapshotChange(e.target.checked)}
                            className="w-3 h-3"
                          />
                          Snapshot
                        </label>
                      )}
                      {cacheKey && (
                        <button
                          type="button"
                          className="px-1.5 py-0.5 rounded border border-border/60 bg-background hover:bg-muted text-xs"
                          onClick={async () => {
                            if (cacheKey) {
                              try { 
                                const { idbDel } = await import("@/lib/idb");
                                await idbDel(cacheKey); 
                              } catch (e) { 
                                console.debug("No se pudo borrar caché", e); 
                              }
                            }
                          }}
                        >
                          Borrar caché
                        </button>
                      )}
                      {snapshotUsed && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          snapshot activo
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Controles de URL */}
                {fullUrl && (
                  <div className="border-t pt-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs">Preview:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="px-1.5 py-0.5 rounded border border-border/60 bg-background hover:bg-muted text-xs"
                          onClick={() => {
                            try {
                              void navigator.clipboard?.writeText(fullUrl);
                            } catch (e) {
                              console.debug("No se pudo copiar URL", e);
                            }
                          }}
                        >
                          Copiar URL
                        </button>
                        <a
                          className="px-1.5 py-0.5 rounded border border-border/60 bg-background hover:bg-muted text-xs"
                          href={fullUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Abrir ↗
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
      {/* Dialogo Renombrar */}
      <Dialog open={!!renameTarget} onOpenChange={(o) => { if (!o) setRenameTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renombrar</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground break-all">{renameTarget}</div>
          <Input
            autoFocus
            placeholder="Nuevo nombre"
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)} disabled={opBusy}>Cancelar</Button>
            <Button onClick={() => void confirmRename()} disabled={!renameInput.trim() || opBusy}>Renombrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo Eliminar */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar</DialogTitle>
          </DialogHeader>
          <div className="text-sm">¿Seguro que deseas eliminar?</div>
          <div className="text-xs text-muted-foreground break-all">{deleteTarget}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={opBusy}>Cancelar</Button>
            <Button variant="destructive" onClick={() => void confirmDelete()} disabled={opBusy}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
