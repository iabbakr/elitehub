
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck, ShoppingCart, Menu, X, LogOut, User as UserIcon, Mail, Briefcase, BadgeHelp, Star, Heart, AlertTriangle, Bell, Home, Users, Package, Share2, ArrowRightLeft, List, Wrench, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getUserProviderRole, checkIfUserIsAlreadyProvider } from '@/lib/data';
import type { Notification, ProviderType } from '@/lib/data';
import { Logo } from '../Logo';
import { Separator } from '@/components/ui/separator';
import { collection, query, where, onSnapshot, orderBy, limit, writeBatch, doc } from 'firebase/firestore';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/products', label: 'All Products', icon: Package },
  { href: '/category/services', label: 'Services', icon: Wrench },
];

function NotificationPanel({ notifications, onOpen }: { notifications: Notification[], onOpen: () => void }) {
    if (notifications.length === 0) {
        return <div className="p-4 text-sm text-center text-muted-foreground">No new notifications.</div>
    }

    return (
        <div className="flex flex-col">
            <div className="p-3 border-b">
                <h4 className="font-medium">Notifications</h4>
            </div>
            <div className="flex flex-col max-h-80 overflow-y-auto">
                {notifications.map(notif => (
                     <Link
                        key={notif.id}
                        href={'/notifications'}
                        className="p-3 border-b hover:bg-muted/50 transition-colors"
                        onClick={onOpen}
                    >
                        <p className="font-semibold text-sm">{notif.senderName}</p>
                        <p className="text-xs text-muted-foreground">{notif.type.replace(/_/g, ' ')}</p>
                        <p className="text-sm mt-1 p-2 bg-muted rounded-md italic">"{notif.text}"</p>
                    </Link>
                ))}
            </div>
             <div className="p-2 text-center border-t">
                <Button variant="link" size="sm" asChild>
                    <Link href="/notifications">View all notifications</Link>
                </Button>
            </div>
        </div>
    )
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const [providerInfo, setProviderInfo] = useState<{type: ProviderType, id: string | null}>({type: null, id: null});
  const [isProviderOrHasPendingApp, setIsProviderOrHasPendingApp] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const isAdmin = user && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  
  const providerLinks = {
    vendor: { profile: `/vendors/${providerInfo.id}`, dashboard: `/vendors/${providerInfo.id}` },
    lawyer: { profile: `/lawyers/${providerInfo.id}`, dashboard: `/lawyers/${providerInfo.id}` },
    logistics: { profile: `/logistics/${providerInfo.id}`, dashboard: `/logistics/${providerInfo.id}` },
    'currency-exchange': { profile: `/currency-exchange/${providerInfo.id}`, dashboard: `/currency-exchange/${providerInfo.id}` },
    service: { profile: `/services/${providerInfo.id}`, dashboard: `/services/${providerInfo.id}` },
  };

  useEffect(() => {
    const updateFavoriteCount = () => {
        const storedFavorites = localStorage.getItem('user-favorites');
        if (storedFavorites) {
            setFavoriteCount(JSON.parse(storedFavorites).length);
        } else {
            setFavoriteCount(0);
        }
    };
    
    updateFavoriteCount(); // Initial count
    
    window.addEventListener('storage', updateFavoriteCount);
    return () => {
        window.removeEventListener('storage', updateFavoriteCount);
    };
  }, []);

  useEffect(() => {
    const checkUserRoles = async () => {
      if (user) {
        const [roleInfo, hasProviderOrApp] = await Promise.all([
          getUserProviderRole(user.uid),
          checkIfUserIsAlreadyProvider(user.uid),
        ]);
        setProviderInfo(roleInfo);
        setIsProviderOrHasPendingApp(hasProviderOrApp);
      } else {
        setProviderInfo({type: null, id: null});
        setIsProviderOrHasPendingApp(false);
      }
    };
    checkUserRoles();
  }, [user]);

  useEffect(() => {
    if (!user) {
        setNotifications([]);
        return;
    };

    const q = query(
        collection(db, "notifications"),
        where("recipientId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
        // Sort on the client side
        notifs.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
        setNotifications(notifs.slice(0, 10));
    });

    return () => unsubscribe();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
      router.push('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sign Out Failed',
        description: 'An error occurred while signing out. Please try again.',
      });
    }
  };

  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };
  
  const showBecomeAVendor = user && !isProviderOrHasPendingApp;
  
  const handleNotificationOpen = () => {
    setIsPopoverOpen(false);
  };


  const mobileUserLinks = (
    <>
      {providerInfo.type ? (
        <>
            <Link href={providerLinks[providerInfo.type]?.dashboard || '/profile'} className="flex items-center p-2 text-lg font-medium transition-colors hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                <UserIcon className="mr-2 h-5 w-5" />
                <span>My Profile</span>
            </Link>
            {providerInfo.type === 'vendor' &&
              <>
                <Link href="/profile/products" className="flex items-center p-2 text-lg font-medium transition-colors hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                    <Briefcase className="mr-2 h-5 w-5" />
                    <span>My Products</span>
                </Link>
                <Link href="/referrals" className="flex items-center p-2 text-lg font-medium transition-colors hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                    <Share2 className="mr-2 h-5 w-5" />
                    <span>Referrals</span>
                </Link>
                <Link href="/kyc" className="flex items-center p-2 text-lg font-medium transition-colors hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                    <BadgeHelp className="mr-2 h-5 w-5" />
                    <span>KYC</span>
                </Link>
              </>
            }
            {providerInfo.type === 'currency-exchange' &&
              <>
                <Link href="/kyc" className="flex items-center p-2 text-lg font-medium transition-colors hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                    <BadgeHelp className="mr-2 h-5 w-5" />
                    <span>KYC</span>
                </Link>
              </>
            }
            <Link href="/subscriptions" className="flex items-center p-2 text-lg font-medium transition-colors hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                <Star className="mr-2 h-5 w-5" />
                <span>Subscriptions</span>
            </Link>
        </>
      ) : (
         <>
            <Link href="/profile" className="flex items-center p-2 text-lg font-medium transition-colors hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                <UserIcon className="mr-2 h-5 w-5" />
                <span>Profile</span>
            </Link>
            {showBecomeAVendor && (
                <Link href="/register" className="flex items-center p-2 text-lg font-medium transition-colors hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                    <Briefcase className="mr-2 h-5 w-5" />
                    <span>Become a Vendor</span>
                </Link>
            )}
            <Link href="/report" className="flex items-center p-2 text-lg font-medium transition-colors hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                <AlertTriangle className="mr-2 h-5 w-5" />
                <span>Report a Vendor</span>
            </Link>
        </>
      )}
    </>
  );

  return (
    <header className="bg-card shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
            {showBecomeAVendor && (
                 <Link
                    href="/register"
                    className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    pathname === '/register' ? 'text-primary' : 'text-muted-foreground'
                    )}
                >
                    Become a Vendor
                </Link>
            )}
             {isAdmin && (
               <Link
                href="/admin"
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === '/admin' ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/favorites">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="h-5 w-5" />
                {user && favoriteCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {favoriteCount}
                    </span>
                )}
                <span className="sr-only">Favorites</span>
              </Button>
            </Link>
            {user && (
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                         <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                            <span className="sr-only">Notifications</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                       <NotificationPanel notifications={notifications} onOpen={handleNotificationOpen} />
                    </PopoverContent>
                </Popover>
            )}
            
            {user ? (
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">My Account</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                       <DropdownMenuItem asChild>
                         <Link href="/admin">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                          </Link>
                      </DropdownMenuItem>
                  )}
                  {providerInfo.type ? (
                    <>
                      <DropdownMenuItem asChild>
                         <Link href={providerLinks[providerInfo.type]?.dashboard || '/profile'}>
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>My Profile</span>
                          </Link>
                      </DropdownMenuItem>
                       {providerInfo.type === 'vendor' && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href="/profile/products">
                                  <Briefcase className="mr-2 h-4 w-4" />
                                  <span>My Products</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/referrals">
                                  <Share2 className="mr-2 h-4 w-4" />
                                  <span>Referrals</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/kyc">
                                  <BadgeHelp className="mr-2 h-4 w-4" />
                                  <span>KYC</span>
                                </Link>
                            </DropdownMenuItem>
                          </>
                       )}
                       {providerInfo.type === 'currency-exchange' && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href="/kyc">
                                  <BadgeHelp className="mr-2 h-4 w-4" />
                                  <span>KYC</span>
                                </Link>
                            </DropdownMenuItem>
                          </>
                       )}
                      <DropdownMenuItem asChild>
                        <Link href="/subscriptions">
                            <Star className="mr-2 h-4 w-4" />
                            <span>Subscriptions</span>
                          </Link>
                      </DropdownMenuItem>
                    </>
                  ) : !isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                         <Link href="/profile">
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                          </Link>
                      </DropdownMenuItem>
                      {showBecomeAVendor && (
                       <DropdownMenuItem asChild>
                         <Link href="/register">
                            <Briefcase className="mr-2 h-4 w-4" />
                            <span>Become a Vendor</span>
                          </Link>
                      </DropdownMenuItem>
                      )}
                       <DropdownMenuItem asChild>
                         <Link href="/report">
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            <span>Report a Vendor</span>
                          </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                   <DropdownMenuItem asChild>
                        <Link href="/notifications">
                            <List className="mr-2 h-4 w-4" />
                            <span>All Notifications</span>
                        </Link>
                    </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login" passHref>
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/signup" passHref>
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
            
            <div className="md:hidden">
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full max-w-sm">
                   <SheetTitle className="sr-only">Menu</SheetTitle>
                  <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between p-4 border-b">
                          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground" onClick={() => setIsMenuOpen(false)}>
                              <Logo />
                          </Link>
                      </div>
                    <nav className="flex-grow flex flex-col gap-2 p-4">
                      {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                           <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsMenuOpen(false)}
                            className={cn(
                                'flex items-center p-2 text-lg font-medium transition-colors hover:text-primary',
                                pathname === link.href ? 'text-primary' : 'text-foreground'
                            )}
                            >
                                <Icon className="mr-2 h-5 w-5" />
                                <span>{link.label}</span>
                            </Link>
                        )
                      })}
                      {isAdmin && (
                         <Link
                          href="/admin"
                          onClick={() => setIsMenuOpen(false)}
                          className={cn(
                            'flex items-center p-2 text-lg font-medium transition-colors hover:text-primary',
                            pathname === '/admin' ? 'text-primary' : 'text-foreground'
                          )}
                        >
                          <ShieldCheck className="mr-2 h-5 w-5" />
                          <span>Admin</span>
                        </Link>
                      )}
                      
                       <Separator className="my-2"/>
                       
                       {user ? mobileUserLinks : null}

                       <Link href="/notifications" className="flex items-center p-2 text-lg font-medium transition-colors hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                            <List className="mr-2 h-5 w-5" />
                            <span>All Notifications</span>
                        </Link>
                       
                    </nav>
                    <div className="p-4 border-t space-y-4">
                      {user ? (
                           <Button variant="outline" className="w-full" onClick={() => { handleSignOut(); setIsMenuOpen(false); }}>
                              <LogOut className="mr-2 h-5 w-5" />
                              Sign Out
                          </Button>
                      ) : (
                        <>
                          <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                             <Button className="w-full">Sign In</Button>
                          </Link>
                           <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                             <Button variant="secondary" className="w-full">Sign Up</Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
