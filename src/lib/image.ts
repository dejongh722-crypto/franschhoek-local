/**
 * Read an image file, center-crop to a square and downscale, returning a small
 * JPEG data URL suitable for storing in localStorage as an avatar.
 */
export async function fileToAvatar(file: File, size = 240): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
  bitmap.close?.();

  return canvas.toDataURL("image/jpeg", 0.82);
}
