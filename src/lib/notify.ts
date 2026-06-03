/** Show a local browser notification if the user has granted permission. */
export function localNotify(title: string, body?: string) {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  } catch {
    /* notifications unsupported / blocked — ignore */
  }
}

/** Ask the browser for notification permission. Returns true if granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (typeof Notification === "undefined") return false;
    if (Notification.permission === "granted") return true;
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}
