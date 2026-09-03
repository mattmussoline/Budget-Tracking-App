import { cn } from "./soft-surface";

type SoftButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function SoftButton({
  className,
  variant = "secondary",
  type = "button",
  children,
  ...props
}: SoftButtonProps) {
  const variantClass = {
    primary: "border-formed-blue bg-formed-blue text-white hover:bg-formed-blue-hover hover:border-formed-blue-hover",
    secondary: "border-hairline bg-panel text-foreground hover:border-hairline-strong hover:bg-panel-warm",
    ghost: "border-transparent bg-transparent text-muted hover:bg-panel-warm hover:text-foreground",
    danger: "border-danger-border bg-danger-soft text-danger hover:border-danger hover:bg-danger hover:text-white"
  }[variant];

  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        variantClass,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
