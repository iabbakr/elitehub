
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, Users, LayoutDashboard, Package, Scale, Truck, ArrowRightLeft, Wrench, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';

const adminNavLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/vendors', label: 'Vendors', icon: Package },
    { href: '/admin/lawyers', label: 'Lawyers', icon: Scale },
    { href: '/admin/logistics', label: 'Logistics', icon: Truck },
    { href: '/admin/currency-exchange', label: 'Currency Exchange', icon: ArrowRightLeft },
    { href: '/admin/services', label: 'Service Providers', icon: Wrench },
];

export function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const isAdmin = user && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    // This useEffect hook is causing the redirect issue. It will be removed.
    // The responsibility for checking admin status should be on the individual admin pages,
    // not in the layout that might wrap other components unexpectedly.
    /*
    useEffect(() => {
        if (!loading) {
            if (!isAdmin) {
                router.push('/');
            }
        }
    }, [user, loading, isAdmin, router]);
    */

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    // If not an admin, we shouldn't render the admin layout at all. 
    // The page-level logic should have already redirected.
    // This is a fallback to prevent non-admins from seeing a broken UI.
    if (!isAdmin) {
        return (
             <div className="flex h-screen w-full items-center justify-center">
                <p>Redirecting...</p>
            </div>
        );
    }
    
    return (
        <div className="flex min-h-screen w-full">
            <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
                <div className="flex h-16 items-center border-b px-6">
                    <Link href="/admin" className="flex items-center gap-2 font-semibold">
                       <Logo />
                    </Link>
                </div>
                <nav className="flex-1 space-y-1 p-4">
                    {adminNavLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
                                pathname === link.href ? 'bg-muted text-primary font-semibold' : ''
                            }`}
                        >
                            <link.icon className="h-4 w-4" />
                            {link.label}
                        </Link>
                    ))}
                </nav>
                 <footer className="p-4 border-t">
                    <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/">
                             <ChevronLeft className="mr-2 h-4 w-4" />
                             Back to Main Site
                        </Link>
                    </Button>
                </footer>
            </aside>
            <div className="flex flex-1 flex-col">
                <header className="flex h-16 items-center gap-4 border-b bg-muted/40 px-6">
                    <h1 className="text-lg font-semibold md:text-2xl">Admin Panel</h1>
                </header>
                <main className="flex-1 p-4 sm:p-6 bg-muted/30">
                    {children}
                </main>
            </div>
        </div>
    );
}
