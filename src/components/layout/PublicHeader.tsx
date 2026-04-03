"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function PublicHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-sm shadow-sm"
          : "bg-white"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-brand-black">
              Gestalt <span className="text-brand-orange">EDU</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/marketplace"
              className="text-sm font-medium text-brand-gray-600 hover:text-brand-orange transition-colors duration-200"
            >
              Marketplace
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-white bg-brand-orange hover:bg-brand-orange-hover px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Entrar
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-brand-gray-600 hover:text-brand-orange transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-brand-gray-200 bg-white">
          <div className="space-y-1 px-4 py-4">
            <Link
              href="/marketplace"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-brand-gray-600 hover:text-brand-orange hover:bg-brand-orange-light rounded-lg transition-colors duration-200"
            >
              Marketplace
            </Link>
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-brand-orange hover:bg-brand-orange-light rounded-lg transition-colors duration-200"
            >
              Entrar
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
