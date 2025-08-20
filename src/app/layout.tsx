
import type { Metadata } from "next";
import "../app/global.css";
import { cn } from "@/lib/utils";
import { ClientLayout } from "@/components/layout/ClientLayout";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.elitehubng.com'),
  title: "Elitehub Nigeria Marketplace",
  description: "The premier marketplace for verified vendors and professionals in Nigeria.",
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
