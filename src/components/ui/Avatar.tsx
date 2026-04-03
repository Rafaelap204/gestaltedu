type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({
  src,
  alt,
  name = "",
  size = "md",
  className = "",
}: AvatarProps) {
  const sizeClasses: Record<AvatarSize, string> = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const fallbackInitials = getInitials(name) || "?";

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-brand-orange text-white font-medium overflow-hidden ${sizeClasses[size]} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className="h-full w-full object-cover"
          onError={(e) => {
            // Hide image on error and show fallback
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : null}
      <span className={src ? "sr-only" : ""}>{fallbackInitials}</span>
    </div>
  );
}
