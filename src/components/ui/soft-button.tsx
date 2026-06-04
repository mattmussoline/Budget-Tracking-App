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
    primary:
      "bg-accent text-white shadow-[5px_5px_10px_rgb(89_82_215_/_0.35),-5px_-5px_10px_rgb(139_132_255_/_0.45)] active:shadow-[inset_3px_3px_6px_rgb(61_54_180_/_0.45),inset_-3px_-3px_6px_rgb(139_132_255_/_0.45)]",
    secondary: "bg-surface text-foreground soft-raised-sm active:soft-inset-sm",
    ghost: "bg-surface text-muted soft-inset-sm"
  }[variant];

  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50",
        variantClass,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
