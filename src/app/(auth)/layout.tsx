export default function AuthRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-gray-50 p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
