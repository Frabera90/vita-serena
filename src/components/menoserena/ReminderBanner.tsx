import { useState } from "react";
import { X } from "lucide-react";
import { shouldShowReminderBanner, type UserProfile } from "@/lib/storage";

interface Props {
  profile: UserProfile;
}

export function ReminderBanner({ profile }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !shouldShowReminderBanner(profile)) return null;

  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-1"
      style={{
        background: "color-mix(in oklab, var(--color-primary) 10%, var(--color-card))",
        border: "1px solid color-mix(in oklab, var(--color-primary) 20%, transparent)",
      }}
    >
      <span className="text-lg">🌿</span>
      <p className="flex-1 text-sm font-medium">Non hai ancora registrato oggi</p>
      <button
        onClick={() => setDismissed(true)}
        className="rounded-full p-1 hover:opacity-60 transition-opacity"
        aria-label="Chiudi"
      >
        <X className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
      </button>
    </div>
  );
}
