import { clsx } from "clsx";

type SoftSurfaceProps = {
  children: React.ReactNode;
  className?: string;
  depth?: "raised" | "inset" | "insetDeep";
  as?: "div" | "section" | "article";
};

const depthClass = {
  raised: "soft-raised",
  inset: "soft-inset",
  insetDeep: "soft-inset-deep"
};

export function cn(...classes: Array<string | false | null | undefined>) {
  return clsx(classes);
}

export function SoftSurface({
  children,
  className,
  depth = "raised",
  as: Component = "div"
}: SoftSurfaceProps) {
  return (
    <Component className={cn("rounded-lg shadow-none", depthClass[depth], className)}>
      {children}
    </Component>
  );
}
