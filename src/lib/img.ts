import type { SyntheticEvent } from "react";
import { categoryImage } from "@/data/categories";

/** Bundled, always-available last-resort placeholder (served from /public). */
export const PLACEHOLDER_IMG = "/placeholder.svg";

/**
 * `onError` handler for any content <img>. If the image fails to load it falls
 * back to a relevant per-category photo; if that fails too (e.g. offline), it
 * falls back to the bundled local placeholder — so a card/detail is never left
 * with a broken image. A dataset flag stops the chain from looping.
 *
 *   <img src={event.image} onError={imgFallback(event.categorySlug, event.id)} />
 */
export function imgFallback(categorySlug?: string, seed?: string) {
  return (e: SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    const stage = el.dataset.fb;
    if (!stage && categorySlug) {
      // First failure with a known category → try a relevant per-category photo.
      el.dataset.fb = "cat";
      el.src = categoryImage(categorySlug, seed);
    } else if (stage !== "placeholder") {
      // No category, or the category photo failed too → bundled local placeholder.
      el.dataset.fb = "placeholder";
      el.src = PLACEHOLDER_IMG;
    }
    // stage === "placeholder": local asset failed too — stop (avoid a loop).
  };
}
