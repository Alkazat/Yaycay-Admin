import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/styles/tokens.css';

export const metadata: Metadata = {
  title: 'Yaycay Admin',
  description: 'Internal ops console for the Yaycay family holiday companion.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/*
          Fredoka (display) + Nunito (body) per the design system. The shared
          styles.css normally pulls these; loaded here directly until the
          shared package is wired in.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- loaded at runtime to avoid build-time font fetches; replaced by the shared design-system styles.css */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
