import { Dumbbell, HeartPulse, Calendar } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { GoalTargetType } from "@/types/goal";

const OPTIONS: { value: GoalTargetType; label: string; description: string; icon: LucideIcon }[] = [
  { value: "lift", label: "Lift", description: "Hit a weight on a specific exercise", icon: Dumbbell },
  { value: "body", label: "Body", description: "Reach a body metric (weight, waist…)", icon: HeartPulse },
  { value: "frequency", label: "Frequency", description: "Train N sessions per week", icon: Calendar },
];

type Props = {
  value: GoalTargetType | null;
  onChange: (v: GoalTargetType) => void;
};

export function GoalTypePicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors ${
              active
                ? "border-accent bg-accent-soft text-fg"
                : "border-line bg-surface-1 text-fg-soft hover:border-line-strong hover:bg-surface-2"
            }`}
          >
            <Icon
              className={`h-4 w-4 ${active ? "text-accent" : "text-fg-muted"}`}
              strokeWidth={2.25}
            />
            <span className="font-display text-sm">{opt.label}</span>
            <span className={`text-[11px] ${active ? "text-fg-muted" : "text-fg-muted"}`}>
              {opt.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
