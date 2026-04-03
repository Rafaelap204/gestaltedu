type SkeletonVariant = "text" | "circle" | "rectangle";

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({
  variant = "text",
  width,
  height,
  className = "",
}: SkeletonProps) {
  const baseStyles = "animate-pulse bg-brand-gray-200 rounded";

  const variantStyles: Record<SkeletonVariant, string> = {
    text: "h-4 w-full rounded",
    circle: "rounded-full",
    rectangle: "rounded-lg",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}
