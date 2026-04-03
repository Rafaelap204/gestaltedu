import { AuthLayout } from "@/components/layout/AuthLayout";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Get role from auth context/session when middleware is implemented
  return <AuthLayout role="student">{children}</AuthLayout>;
}
