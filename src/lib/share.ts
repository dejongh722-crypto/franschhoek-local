type ShareResult = "shared" | "copied" | "cancelled" | "failed";

/**
 * Share via the native share sheet when available, otherwise copy the link.
 * Returns what happened so the caller can show appropriate feedback.
 */
export async function share(data: { title: string; text?: string; url?: string }): Promise<ShareResult> {
  const url = data.url ?? window.location.href;

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: data.title, text: data.text, url });
      return "shared";
    } catch {
      // User dismissed the share sheet (AbortError) — treat as a no-op.
      return "cancelled";
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
