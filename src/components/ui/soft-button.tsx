import { cn } from "./soft-surface";

type SoftButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function SoftButton({
  className,
  variant = "secondary",
  type = "button",
  children,
  ...props
}: SoftButtonProps) {
  const variantClass = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-gray-100 text-foreground hover:bg-gray-200",
    ghost: "bg-transparent text-muted hover:bg-gray-100"
  }[variant];

  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-extrabold uppercase tracking-wide shadow-none transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100",
        variantClass,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
