// src/app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-pca-black">
      {/* Aquí no hay Navbar ni Footer públicos */}
      {children}
    </div>
  );
}