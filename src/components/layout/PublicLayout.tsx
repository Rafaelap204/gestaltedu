import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { ReferralCapture } from "@/components/utils/ReferralCapture";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <ReferralCapture />
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
