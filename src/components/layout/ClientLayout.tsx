
"use client";

import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageNavigation } from "@/components/layout/PageNavigation";
import { AuthProvider } from "@/context/AuthContext";
import { AddProductFAB } from "@/components/vendor/AddProductFAB";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col">
        <PageNavigation>{children}</PageNavigation>
      </main>
      <Footer />
      <AddProductFAB />
      <Toaster />
    </AuthProvider>
  );
}
