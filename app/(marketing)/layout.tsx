// src/app/(marketing)/layout.tsx - Marketing Layout (con Navbar y Footer)
import { Navbar } from '../../src/components/organisms/Navbar';
import { Footer } from '../../src/components/organisms/Footer';
import { WhatsAppButton } from '../../src/components/atoms/WhatsAppButton';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}