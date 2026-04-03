"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Store,
  Share2,
  Settings,
  BarChart3,
  GraduationCap,
  Wallet,
  Users,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type UserRole = "student" | "teacher" | "admin";

interface SidebarProps {
  role: UserRole;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navigationConfig: Record<UserRole, NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/app", icon: LayoutDashboard },
    { label: "Meus Cursos", href: "/app/my-courses", icon: BookOpen },
    { label: "Marketplace", href: "/marketplace", icon: Store },
    { label: "Indicação", href: "/app/referrals", icon: Share2 },
    { label: "Configurações", href: "/app/settings", icon: Settings },
  ],
  teacher: [
    { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
    { label: "Métricas", href: "/teacher/metrics", icon: BarChart3 },
    { label: "Cursos", href: "/teacher/courses", icon: GraduationCap },
    { label: "Financeiro", href: "/teacher/finance", icon: Wallet },
    { label: "Configurações", href: "/teacher/settings", icon: Settings },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Métricas", href: "/admin/metrics", icon: BarChart3 },
    { label: "Cursos", href: "/admin/courses", icon: GraduationCap },
    { label: "Usuários", href: "/admin/users", icon: Users },
    { label: "Inscrições", href: "/admin/enrollments", icon: ClipboardList },
    { label: "Financeiro", href: "/admin/financial", icon: Wallet },
    { label: "Configurações", href: "/admin/settings", icon: Settings },
  ],
};

export function Sidebar({ role }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const navItems = navigationConfig[role];

  const isActive = (href: string) => {
    if (href === "/app" || href === "/teacher" || href === "/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-white border-r border-brand-gray-200 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-brand-gray-200">
        <Link href="/" className="flex items-center gap-2">
          {isCollapsed ? (
            <span className="text-xl font-bold text-brand-orange">G</span>
          ) : (
            <span className="text-xl font-bold text-brand-black">
              Gestalt <span className="text-brand-orange">EDU</span>
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                    active
                      ? "bg-brand-orange-light text-brand-orange border-l-4 border-brand-orange"
                      : "text-brand-gray-600 hover:bg-brand-gray-100 hover:text-brand-gray-900 border-l-4 border-transparent"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    size={20}
                    className={active ? "text-brand-orange" : ""}
                  />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Button */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-brand-gray-200 p-2">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-brand-gray-500 hover:bg-brand-gray-100 hover:text-brand-gray-900 transition-colors duration-200"
          aria-label={isCollapsed ? "Expandir menu" : "Colapsar menu"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!isCollapsed && (
            <span className="text-sm font-medium">Recolher</span>
          )}
        </button>
      </div>
    </aside>
  );
}
