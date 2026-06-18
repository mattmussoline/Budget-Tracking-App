import { cn } from "./soft-surface";

type SoftSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
  error?: string;
};

export function SoftSelect({ label, options, placeholder, error, className, id, ...props }: SoftSelectProps) {
  const fieldId = id ?? props.name;

  return (
    <label className="grid gap-2 text-xs font-extrabold uppercase tracking-wide text-foreground" htmlFor={fieldId}>
      {label}
      <select
        id={fieldId}
        className={cn(
          "min-h-12 w-full rounded-md border-0 bg-white px-4 text-base font-medium normal-case tracking-normal text-foreground shadow-none focus:border-2 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-70",
          className
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
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
