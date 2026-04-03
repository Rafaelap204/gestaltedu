"use client";

import { useState } from "react";
import { Bell, Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { UserMenu } from "./UserMenu";
import { AIWidget } from "./AIWidget";

type UserRole = "student" | "teacher" | "admin";

interface AuthLayoutProps {
  children: React.ReactNode;
  role: UserRole;
  pageTitle?: string;
}

export function AuthLayout({ children, role, pageTitle }: AuthLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar role={role} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between px-4 border-b border-brand-gray-200">
              <span className="text-xl font-bold text-brand-black">
                Gestalt <span className="text-brand-orange">EDU</span>
              </span>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-2 text-brand-gray-600 hover:text-brand-orange"
              >
                <X size={24} />
              </button>
            </div>
            <Sidebar role={role} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-brand-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Left: Mobile Menu Button & Page Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 text-brand-gray-600 hover:text-brand-orange transition-colors duration-200"
                aria-label="Abrir menu"
              >
                <Menu size={24} />
              </button>
              {pageTitle && (
                <h1 className="text-xl font-semibold text-brand-gray-900">
                  {pageTitle}
                </h1>
              )}
            </div>

            {/* Right: Notifications & User Menu */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Notification Bell */}
              <button
                className="relative p-2 text-brand-gray-600 hover:text-brand-orange hover:bg-brand-gray-100 rounded-lg transition-colors duration-200"
                aria-label="Notificações"
              >
                <Bell size={20} />
                {/* Notification Badge */}
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-orange" />
              </button>

              {/* User Menu */}
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* AI Widget */}
      <AIWidget />
    </div>
  );
}
