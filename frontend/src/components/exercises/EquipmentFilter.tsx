type Props = {
  value: string | null;
  options: string[];
  onChange: (equipment: string | null) => void;
};

// Source data is lowercase ("body only", "e-z curl bar"); custom exercises are
// whatever the user typed. Title-case for display, leave the value untouched.
function formatEquipment(equipment: string): string {
  return equipment
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function EquipmentFilter({ value, options, onChange }: Props) {
  if (options.length === 0) return null;

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="rounded-full border border-line-strong bg-surface-1 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft [color-scheme:dark]"
    >
      <option value="" className="bg-surface-2 text-fg">
        All equipment
      </option>
      {options.map((eq) => (
        <option key={eq} value={eq} className="bg-surface-2 text-fg">
          {formatEquipment(eq)}
        </option>
      ))}
    </select>
  );
}
