import { SandpackLayout, SandpackPreview } from "@codesandbox/sandpack-react";


interface SandpackRunnerProps {
  height?: string | number;
}

export function SandpackRunner({ height = "calc(100vh - 160px)" }: SandpackRunnerProps) {
  return (
    <SandpackLayout>
      <SandpackPreview
        id="main"
        showNavigator
        showRefreshButton={false}
        showOpenInCodeSandbox
        style={{ height }}
      />
    </SandpackLayout>
  );
}
