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
            className={`flex flex-col items-start gap-1 rounded-xl p-3 text-left ring-1 transition-colors ${
              active ? "bg-gray-900 text-white ring-gray-900" : "bg-white text-gray-900 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm font-semibold">{opt.label}</span>
            <span className={`text-xs ${active ? "text-gray-300" : "text-gray-500"}`}>
              {opt.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
