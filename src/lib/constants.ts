export type PreviewEnv =
  | "mock-one-component"
  | "n8n-ia-one-component"
  | "mock-more-components"
  | "n8n-ia-more-components";

export const DEFAULT_PREVIEW_ENV: PreviewEnv = "mock-one-component";

export const PREVIEW_ENV_OPTIONS: Array<{ id: PreviewEnv; label: string; disabled?: boolean }> = [
  { id: "mock-one-component", label: "Mock: un componente" },
  { id: "n8n-ia-one-component", label: "n8n IA: un componente" },
  { id: "mock-more-components", label: "Mock: varios componentes (WIP)", disabled: true },
  { id: "n8n-ia-more-components", label: "n8n IA: varios componentes (WIP)", disabled: true },
];

// URLs de endpoints por entorno (solo usamos la de un componente por ahora)
export const PREVIEW_API_URLS: Partial<Record<PreviewEnv, string>> = {
  "n8n-ia-one-component": "https://openlabmx.app.n8n.cloud/webhook-test/preview",
  // "n8n-ia-more-components": "",
};
