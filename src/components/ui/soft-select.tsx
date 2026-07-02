import { cn } from "./soft-surface";
import { useId } from "react";

type SoftSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
  error?: string;
  surface?: "muted" | "white";
};

export function SoftSelect({ label, options, placeholder, error, surface = "muted", className, id, ...props }: SoftSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? (props.name ? `${props.name}-${generatedId}` : generatedId);

  return (
    <label className="grid gap-2 text-xs font-extrabold uppercase tracking-wide text-foreground" htmlFor={fieldId}>
      {label}
      <select
        id={fieldId}
        className={cn(
          "min-h-12 w-full rounded-md border-0 px-4 text-base font-medium normal-case tracking-normal text-foreground shadow-none focus:border-2 focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-70",
          surface === "white" ? "bg-white" : "bg-gray-100",
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
