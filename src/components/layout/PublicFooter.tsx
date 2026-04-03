import Link from "next/link";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-brand-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-brand-black">
              Gestalt <span className="text-brand-orange">EDU</span>
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="text-sm text-brand-gray-500 hover:text-brand-orange transition-colors duration-200"
            >
              Termos de Uso
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-brand-gray-500 hover:text-brand-orange transition-colors duration-200"
            >
              Política de Privacidade
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-sm text-brand-gray-400">
            &copy; {currentYear} Gestalt EDU. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
