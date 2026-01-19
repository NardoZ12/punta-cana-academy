// src/app/layout.tsx - Root Layout (Neutro)
import './globals.css';
import { Inter } from 'next/font/google';
import Providers from '../src/utils/Providers';
import { EmailVerificationBanner } from '../src/components/molecules/EmailVerificationBanner';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Punta Cana Academy',
  description: 'La academia híbrida más moderna del Caribe.',
  icons: {
    icon: '/images/logos/favicon.png',
    shortcut: '/images/logos/favicon.png',
    apple: '/images/logos/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.className}>
      <body className="bg-pca-black">
        <Providers>
          <EmailVerificationBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
