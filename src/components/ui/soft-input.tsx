import { cn } from "./soft-surface";
import { useId } from "react";

type SoftInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  surface?: "muted" | "white";
};

export function SoftInput({ label, error, surface = "muted", className, id, ...props }: SoftInputProps) {
  const generatedId = useId();
  const fieldId = id ?? (props.name ? `${props.name}-${generatedId}` : generatedId);

  return (
    <label className="grid gap-1.5 text-xs font-semibold text-muted" htmlFor={fieldId}>
      {label}
      <input
        id={fieldId}
        className={cn(
          "min-h-10 w-full rounded-lg border border-hairline px-3 text-sm font-normal text-foreground transition-colors placeholder:text-faint hover:border-hairline-strong focus:border-formed-blue focus:bg-panel disabled:cursor-not-allowed disabled:opacity-70",
          surface === "white" ? "bg-panel" : "bg-panel-warm",
          error && "border-danger",
          className
        )}
        {...props}
      />
      {error ? <span className="text-sm font-medium text-danger">{error}</span> : null}
    </label>
  );
}
