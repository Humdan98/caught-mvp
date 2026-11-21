import { Check } from "lucide-react";

/** One-line confirmation shown after a redirect (?saved=1 etc.). */
export function Flash({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-ink/15 bg-sheet px-3 py-2 text-sm animate-fade-up">
      <Check className="size-4" aria-hidden /> {message}
    </div>
  );
}
