
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchUserByUid, getUserProviderRole, type UserData, checkIfUserHasPendingApplication } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, Mail, Heart, Clock, AlertTriangle, ShieldCheck, Package } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [pendingApplicationType, setPendingApplicationType] = useState<string | null>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  const isAdmin = user && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      setLoadingData(true);
      
      // Redirect admins to their dashboard immediately
      if (isAdmin) {
          router.replace('/admin');
          return;
      }

      // Check for an active provider role first
      const { type, id } = await getUserProviderRole(user.uid);
      if (type && id) {
        let path = '';
        switch (type) {
          case 'vendor': path = `/vendors/${id}`; break;
          case 'lawyer': path = `/lawyers/${id}`; break;
          case 'logistics': path = `/logistics/${id}`; break;
          case 'currency-exchange': path = `/currency-exchange/${id}`; break;
          case 'service': path = `/services/${id}`; break;
        }
        if (path) {
            router.replace(path);
            return;
        }
      }

      // If no active provider role, load user data and check for pending applications
      const [appType, associatedUser] = await Promise.all([
          checkIfUserHasPendingApplication(user.uid),
          fetchUserByUid(user.uid)
      ]);
      
      setPendingApplicationType(appType);
      if (associatedUser) {
        setUserData(associatedUser);
      }
      const storedFavorites = localStorage.getItem('user-favorites');
      if (storedFavorites) {
        setFavoriteCount(JSON.parse(storedFavorites).length);
      }
      setLoadingData(false);
    };

    loadData();
  }, [user, authLoading, router, isAdmin]);

  if (authLoading || loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Loading Profile...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Could not load user data. You may be redirected.</p>
      </div>
    );
  }

  const showBecomeAProviderLink = user && !isAdmin && !pendingApplicationType;

  return (
    <div className="flex justify-center items-center py-12">
        <Card className="w-full max-w-lg shadow-xl">
            {pendingApplicationType && (
                <div className="p-4 bg-blue-50 border-b border-blue-200 text-center">
                    <div className="flex items-center justify-center gap-2">
                         <Clock className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-blue-800">Application Under Review</h3>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">Your application to become a {pendingApplicationType} is pending approval.</p>
                </div>
            )}
            <CardHeader className="text-center">
                <div className="mx-auto bg-primary text-primary-foreground rounded-full h-20 w-20 flex items-center justify-center">
                    <User className="h-10 w-10" />
                </div>
                <CardTitle className="mt-4 text-3xl font-bold font-headline">{userData.fullName}</CardTitle>
                <CardDescription>{userData.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-3 text-muted-foreground">
                    <Mail className="h-5 w-5" />
                    <span>Email</span>
                   </div>
                   <span className="font-medium">{userData.email}</span>
                </div>
                 <div className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-3 text-muted-foreground">
                    <Heart className="h-5 w-5" />
                    <span>Favorited Products</span>
                   </div>
                   <span className="font-medium">{favoriteCount}</span>
                </div>
                 <div className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-3 text-muted-foreground">
                    <User className="h-5 w-5" />
                    <span>Account Type</span>
                   </div>
                   <span className="font-medium">Buyer</span>
                </div>
                {showBecomeAProviderLink && (
                  <Link href="/register" passHref>
                      <Button variant="outline" className="w-full mt-4">
                          <Package className="mr-2 h-4 w-4"/>
                          Become a Vendor or Service Provider
                      </Button>
                  </Link>
                )}
                <div className="pt-4">
                    <Link href="/report" passHref>
                        <Button variant="destructive" className="w-full">
                           <AlertTriangle className="mr-2 h-4 w-4" /> Report an Issue
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
