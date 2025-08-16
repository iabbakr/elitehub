
import { AuthProvider } from '@/context/AuthContext';
import { AdminLayoutContent } from '@/components/layout/AdminLayoutContent';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
    // This layout is a Server Component.
    // It wraps the content in the AuthProvider and then renders the client-side UI shell.
    return (
        <AuthProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </AuthProvider>
    );
}
