import { useRef, useState } from "react";
import { ImageUp, Link2, Loader2 } from "lucide-react";
import { uploadImage } from "@/lib/upload";
import { useToast } from "@/store/toast";

/** Image picker for admin forms: upload a photo (Supabase Storage) or paste a URL. */
export function ImageField({
  value,
  onChange,
  folder = "uploads",
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    const { url, error } = await uploadImage(file, folder);
    setBusy(false);
    if (error) return toast(`Upload failed: ${error}`);
    if (url) {
      onChange(url);
      toast("Image uploaded");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sand ring-1 ring-black/5">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted">
              <ImageUp className="h-5 w-5" strokeWidth={1.75} />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex items-center gap-2 rounded-full bg-wine px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-wine-soft disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <ImageUp className="h-4 w-4" strokeWidth={2} />}
          {busy ? "Uploading…" : "Upload photo"}
        </button>
      </div>
      <label className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-black/10">
        <Link2 className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.75} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="…or paste an image URL"
          className="w-full bg-transparent text-ink outline-none placeholder:text-muted"
        />
      </label>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
