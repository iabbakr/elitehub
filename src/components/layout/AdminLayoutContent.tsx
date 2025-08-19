
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, Users, LayoutDashboard, Package, Scale, Truck, ArrowRightLeft, Wrench, ChevronLeft, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

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
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const isAdmin = user && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    useEffect(() => {
        if (!loading) {
            if (!isAdmin) {
                router.push('/');
            }
        }
    }, [user, loading, isAdmin, router]);

    if (loading || !isAdmin) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const navContent = (
        <>
            <nav className="flex-1 space-y-1 p-4">
                {adminNavLinks.map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsSheetOpen(false)}
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
        </>
    );

    return (
        <div className="flex min-h-screen w-full">
            <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
                <div className="flex h-16 shrink-0 items-center border-b px-6">
                    <Link href="/admin" className="flex items-center gap-2 font-semibold">
                       <Logo />
                    </Link>
                </div>
                {navContent}
            </aside>
            <div className="flex flex-1 flex-col">
                <header className="flex h-16 items-center gap-4 border-b bg-muted/40 px-4 md:px-6">
                     <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="sm:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0 w-full max-w-sm">
                            <div className="flex h-16 shrink-0 items-center border-b px-6">
                                <Link href="/admin" className="flex items-center gap-2 font-semibold">
                                <Logo />
                                </Link>
                            </div>
                            {navContent}
                        </SheetContent>
                    </Sheet>
                    <h1 className="text-lg font-semibold md:text-2xl">Admin Panel</h1>
                </header>
                <main className="flex-1 p-4 md:p-6 lg:p-8 bg-muted/30 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
