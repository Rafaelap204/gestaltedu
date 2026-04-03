import { Loader2 } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  asChild?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  asChild = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary:
      "bg-brand-orange text-white hover:bg-brand-orange-hover shadow-sm",
    secondary: "bg-brand-gray-100 text-brand-gray-900 hover:bg-brand-gray-200",
    ghost:
      "bg-transparent text-brand-gray-700 hover:bg-brand-gray-100",
    destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
    outline:
      "bg-transparent border border-brand-gray-300 text-brand-gray-700 hover:bg-brand-gray-50 hover:border-brand-gray-400",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={size === "lg" ? 20 : 16} className="animate-spin" />}
      {children}
    </Comp>
  );
}
