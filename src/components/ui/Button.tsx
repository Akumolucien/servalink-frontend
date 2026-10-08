import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "danger-outline" | "light";
type Size = "sm" | "md" | "lg";

const classes = (variant: Variant, size: Size, block?: boolean, extra?: string) =>
  ["btn", `btn-${variant}`, size !== "md" && `btn-${size}`, block && "btn-block", extra].filter(Boolean).join(" ");

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", block, loading, icon, children, className, disabled, type = "button", ...rest }, ref,
) {
  return (
    <button ref={ref} type={type} className={classes(variant, size, block, className)} disabled={disabled || loading}
      aria-busy={loading || undefined} {...rest}>
      {loading ? <span className="spinner" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
});

interface ButtonLinkProps extends LinkProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: ReactNode;
}

export function ButtonLink({ variant = "primary", size = "md", block, icon, children, className, ...rest }: ButtonLinkProps) {
  return <Link className={classes(variant, size, block, className)} {...rest}>{icon}{children}</Link>;
}
