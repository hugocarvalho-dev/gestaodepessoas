import type { Metadata } from 'next';
import { Inter, DM_Sans } from 'next/font/google';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'Lume | Gestão de Pessoas',
  description: 'Sistema estratégico para gestão de pessoas e organizações',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${dmSans.variable} ${inter.className}`}>
        <ThemeProvider>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
