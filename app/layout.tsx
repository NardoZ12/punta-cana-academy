// src/app/layout.tsx - Root Layout (Neutro)
import './globals.css';
import { Inter } from 'next/font/google';
import Script from 'next/script';
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
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-5QMFTBP765"
          strategy="beforeInteractive"
        />
        <Script id="gtag-init" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-5QMFTBP765');
          `}
        </Script>
      </head>
      <body className="bg-pca-black">
        <Providers>
          <EmailVerificationBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
