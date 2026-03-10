import { AVATAR_LIST } from "@/lib/avatars";
import { Check } from "lucide-react";

interface AvatarSelectorProps {
  value: string;
  onChange: (avatarId: string) => void;
  label?: string;
}

export function AvatarSelector({ value, onChange, label = "Select Your Pilot" }: AvatarSelectorProps) {
  return (
    <div className="space-y-3">
      {label && <label className="text-sm font-semibold text-foreground uppercase tracking-wider">{label}</label>}
      <div className="grid grid-cols-6 gap-2">
        {AVATAR_LIST.map((avatar) => (
          <button
            key={avatar.id}
            onClick={() => onChange(avatar.id)}
            className={`relative overflow-hidden rounded-lg border-2 transition-all hover:scale-105 ${
              value === avatar.id
                ? "border-accent shadow-[0_0_12px_hsl(var(--accent)/0.5)]"
                : "border-border/30 hover:border-border/60"
            }`}
            data-testid={`avatar-select-${avatar.id}`}
          >
            <img
              src={avatar.image}
              alt={avatar.id}
              className="w-full h-full aspect-square object-cover"
            />
            {value === avatar.id && (
              <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                <Check className="h-5 w-5 text-accent drop-shadow-lg" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
