import { cn } from "./soft-surface";

type SoftSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: Array<{ label: string; value: string }>;
  error?: string;
};

export function SoftSelect({ label, options, error, className, id, ...props }: SoftSelectProps) {
  const fieldId = id ?? props.name;

  return (
    <label className="grid gap-2 text-sm font-bold text-foreground" htmlFor={fieldId}>
      {label}
      <select
        id={fieldId}
        className={cn(
          "min-h-12 w-full rounded-2xl border-0 bg-surface px-4 text-base text-foreground soft-inset focus:soft-inset-deep disabled:cursor-not-allowed disabled:opacity-70",
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-sm font-medium text-red-700">{error}</span> : null}
    </label>
  );
}
