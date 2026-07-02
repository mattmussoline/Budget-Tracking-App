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
    <label className="grid gap-2 text-xs font-extrabold uppercase tracking-wide text-foreground" htmlFor={fieldId}>
      {label}
      <input
        id={fieldId}
        className={cn(
          "min-h-12 w-full rounded-md border-0 px-4 text-base font-medium normal-case tracking-normal text-foreground shadow-none placeholder:text-gray-500 focus:border-2 focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-70",
          surface === "white" ? "bg-white" : "bg-gray-100",
          className
        )}
        {...props}
      />
      {error ? <span className="text-sm font-medium text-red-700">{error}</span> : null}
    </label>
  );
}
