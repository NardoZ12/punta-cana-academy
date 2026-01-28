// src/app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white">
      {/* Aquí no hay Navbar ni Footer públicos */}
      {children}
    </div>
  );
}