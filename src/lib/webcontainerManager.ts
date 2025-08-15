import type { WebContainer } from "@webcontainer/api";
import { WebContainer as WebContainerAPI } from "@webcontainer/api";

let bootPromise: Promise<WebContainer> | null = null;
let instance: WebContainer | null = null;
let users = 0;

export async function getWebContainer(): Promise<WebContainer> {
  if (instance) return instance;
  bootPromise ??= WebContainerAPI.boot({ coep: "credentialless" });
  instance = await bootPromise;
  return instance;
}

export function acquireWebContainer(): void {
  users += 1;
}

export async function releaseWebContainer(): Promise<void> {
  users = Math.max(0, users - 1);
  if (users === 0 && instance) {
    try {
      await instance.teardown();
    } catch {
      // noop
    } finally {
      instance = null;
      bootPromise = null;
    }
  }
}
