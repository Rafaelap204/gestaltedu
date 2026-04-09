import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Área de Membros - Gestalt EDU",
  description: "Acesse seu conteúdo exclusivo na área de membros",
};

export default function MembersAreaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Layout minimalista para área de membros - sem header/sidebar do dashboard
  return <>{children}</>;
}
