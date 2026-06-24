import { cn } from "@/components/ui/soft-surface";
import { TONE_CLASSES, type PlanningOption, type PlanningTone } from "../planning-constants";

type ColoredSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: ReadonlyArray<PlanningOption>;
};

export function ColoredSelect({ label, options, id, className, value, ...props }: ColoredSelectProps) {
  const fieldId = id ?? props.name;
  const selected = options.find((option) => option.value === value);
  const tone: PlanningTone = selected?.tone ?? "slate";

  return (
    <label className="grid gap-2 text-xs font-extrabold uppercase tracking-wide" htmlFor={fieldId}>
      {label}
      <select
        {...props}
        id={fieldId}
        value={value}
        className={cn("min-h-11 rounded-md border-0 px-3 text-sm font-bold normal-case tracking-normal", TONE_CLASSES[tone].field, className)}
      >
        <option value="">Choose {label.toLowerCase()}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
