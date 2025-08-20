
import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClientLayout } from "@/components/layout/ClientLayout";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.elitehubng.com'),
  title: {
    default: "EliteHub Nigeria - Premier Marketplace for Verified Vendors",
    template: "%s | EliteHub NG"
  },
  description: "Welcome to EliteHub Nigeria (elitehub.ng), the premier marketplace for verified vendors and professionals in Nigeria. Shop with confidence at the elitehub nigeria marketplace.",
  keywords: [
    'elitehub',
    'elitehubng',
    'elitehub nigeria',
    'elitehub nigeria marketplace',
    'verified vendors nigeria',
    'buy and sell nigeria',
    'trusted marketplace nigeria',
    'professional services nigeria'
  ]
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          "font-body antialiased bg-background flex flex-col h-full"
        )}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
