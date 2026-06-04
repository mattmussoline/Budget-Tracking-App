import { cn } from "./soft-surface";

type SoftInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function SoftInput({ label, error, className, id, ...props }: SoftInputProps) {
  const fieldId = id ?? props.name;

  return (
    <label className="grid gap-2 text-sm font-bold text-foreground" htmlFor={fieldId}>
      {label}
      <input
        id={fieldId}
        className={cn(
          "min-h-12 w-full rounded-2xl border-0 bg-surface px-4 text-base text-foreground soft-inset placeholder:text-[#718096] focus:soft-inset-deep disabled:cursor-not-allowed disabled:opacity-70",
          className
        )}
        {...props}
      />
      {error ? <span className="text-sm font-medium text-red-700">{error}</span> : null}
    </label>
  );
}
