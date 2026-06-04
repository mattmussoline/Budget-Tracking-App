import { cn } from "./soft-surface";

type SoftInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function SoftInput({ label, error, className, id, ...props }: SoftInputProps) {
  const fieldId = id ?? props.name;

  return (
    <label className="grid gap-2 text-xs font-extrabold uppercase tracking-wide text-foreground" htmlFor={fieldId}>
      {label}
      <input
        id={fieldId}
        className={cn(
          "min-h-12 w-full rounded-md border-0 bg-gray-100 px-4 text-base font-medium normal-case tracking-normal text-foreground shadow-none placeholder:text-gray-500 focus:border-2 focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-70",
          className
        )}
        {...props}
      />
      {error ? <span className="text-sm font-medium text-red-700">{error}</span> : null}
    </label>
  );
}
