// src/app/layout.tsx - Root Layout (Neutro)
import './globals.css';
import { Inter } from 'next/font/google';
import Providers from '../src/utils/Providers';
import { EmailVerificationBanner } from '../src/components/molecules/EmailVerificationBanner';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Punta Cana Academy',
  description: 'La academia híbrida más moderna del Caribe.',
  icons: {
    icon: [
      { url: '/images/logos/favicon-definitivo.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/logos/favicon-definitivo.png', sizes: '192x192', type: 'image/png' }
    ],
    shortcut: '/images/logos/favicon-definitivo.png',
    apple: '/images/logos/favicon-definitivo.png',
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
        <Script 
          src="https://www.googletagmanager.com/gtag/js?id=G-5QMFTBP765"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`\n            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5QMFTBP765');\n          `}
        </Script>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00bcd4" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Punta Cana Academy" />
        <link rel="apple-touch-icon" href="/images/logos/favicon-definitivo.png" />
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