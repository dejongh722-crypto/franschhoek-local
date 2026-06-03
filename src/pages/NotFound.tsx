import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-wine/10 text-wine">
        <Compass className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Page not found</h1>
      <p className="mt-1 max-w-xs text-sm text-muted">That page doesn't exist or has moved.</p>
      <button
        onClick={() => navigate("/")}
        className="mt-6 rounded-full bg-wine px-5 py-2.5 text-sm font-semibold text-white"
      >
        Back home
      </button>
    </div>
  );
}
