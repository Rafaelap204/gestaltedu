import { ReactNode } from "react";
import { Inbox, FileQuestion, Search, PlayCircle, BookOpen, Filter, Plus, LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Inbox,
  FileQuestion,
  Search,
  PlayCircle,
  BookOpen,
  Filter,
  Plus
}

interface EmptyStateProps {
  iconName?: keyof typeof iconMap;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  iconName,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  const Icon = iconName ? iconMap[iconName] : null
  
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}
    >
      {Icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange-light mb-4">
          <Icon size={32} className="text-brand-orange" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-brand-gray-500 max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
