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
    <label className="grid gap-1.5 text-xs font-semibold text-muted" htmlFor={fieldId}>
      {label}
      <select
        id={fieldId}
        className={cn(
          "min-h-11 w-full rounded-lg border border-hairline px-3 text-base font-normal text-foreground transition-colors hover:border-hairline-strong focus:border-formed-blue focus:bg-panel disabled:cursor-not-allowed disabled:opacity-70",
          surface === "white" ? "bg-panel" : "bg-panel-warm",
          error && "border-danger",
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
      {error ? <span className="text-sm font-medium text-danger">{error}</span> : null}
    </label>
  );
}
