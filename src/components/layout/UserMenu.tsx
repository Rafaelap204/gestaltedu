"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";

interface UserMenuProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Default user for demo
  const currentUser = user || {
    name: "Usuário",
    email: "usuario@gestalt.edu",
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-brand-gray-100 transition-colors duration-200"
      >
        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange text-white text-sm font-medium">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            getInitials(currentUser.name)
          )}
        </div>

        {/* Name & Email */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-brand-gray-900">
            {currentUser.name}
          </p>
          <p className="text-xs text-brand-gray-500">{currentUser.email}</p>
        </div>

        <ChevronDown
          size={16}
          className={`text-brand-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-lg border border-brand-gray-200 py-1 z-50">
          <div className="px-4 py-3 border-b border-brand-gray-100 md:hidden">
            <p className="text-sm font-medium text-brand-gray-900">
              {currentUser.name}
            </p>
            <p className="text-xs text-brand-gray-500">{currentUser.email}</p>
          </div>

          <Link
            href="/app/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-gray-700 hover:bg-brand-gray-50 hover:text-brand-orange transition-colors duration-200"
          >
            <User size={18} />
            Meu Perfil
          </Link>

          <Link
            href="/app/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-gray-700 hover:bg-brand-gray-50 hover:text-brand-orange transition-colors duration-200"
          >
            <Settings size={18} />
            Configurações
          </Link>

          <div className="my-1 border-t border-brand-gray-100" />

          <button
            onClick={async () => {
              setIsOpen(false);
              setIsLoggingOut(true);
              try {
                await signOutAction();
                router.push('/login');
                router.refresh();
              } catch (error) {
                console.error('Erro ao fazer logout:', error);
              } finally {
                setIsLoggingOut(false);
              }
            }}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 disabled:opacity-50"
          >
            <LogOut size={18} />
            {isLoggingOut ? 'Saindo...' : 'Sair'}
          </button>
        </div>
      )}
    </div>
  );
}
