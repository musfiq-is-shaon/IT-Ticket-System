import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IT Ticket System - Enterprise Helpdesk Solution',
  description: 'Modern multi-tenant IT ticket management system for enterprise helpdesk operations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 font-sans">
        {children}
      </body>
    </html>
  );
}

