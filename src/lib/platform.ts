import { Capacitor } from "@capacitor/core";

/** True when running inside the native iOS/Android (Capacitor) shell, not a browser. */
export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** "ios" | "android" | "web". */
export function getPlatform(): string {
  try {
    return Capacitor.getPlatform();
  } catch {
    return "web";
  }
}

/**
 * Open a URL in the device's external browser rather than an in-app webview.
 * On native, Capacitor routes window.open(_blank) to the system browser — which is
 * what we want for payments, so the purchase happens on the web (off app-store IAP).
 */
export function openExternal(url: string): void {
  window.open(url, "_blank", "noopener");
}
