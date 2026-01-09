// src/app/layout.tsx
import './globals.css';
import Providers from '../src/utils/Providers';

export const metadata = {
  title: 'Punta Cana Academy',
  description: 'La academia híbrida más moderna del Caribe.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-pca-black">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
