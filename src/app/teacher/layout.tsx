import { AuthLayout } from "@/components/layout/AuthLayout";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Get role from auth context/session when middleware is implemented
  return <AuthLayout role="teacher">{children}</AuthLayout>;
}
