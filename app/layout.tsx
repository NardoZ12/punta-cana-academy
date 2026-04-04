// src/app/layout.tsx - Root Layout (Neutro)
import './globals.css';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import Providers from '../src/utils/Providers';
import { EmailVerificationBanner } from '../src/components/molecules/EmailVerificationBanner';

const inter = Inter({ subsets: ['latin'] });

const GA_MEASUREMENT_ID = 'G-5QMFTBP765';

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
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
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
