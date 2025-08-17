

'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchUserByUid, getUserProviderRole, type UserData } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, Mail, Heart, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [hasPendingApplication, setHasPendingApplication] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  const isAdmin = user && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      const loadData = async () => {
        setLoadingData(true);
        
        // If user is not admin, check for provider roles
        if (!isAdmin) {
          const { type, id } = await getUserProviderRole(user.uid);
          if (type && id) {
              let path = '';
              switch(type) {
                  case 'vendor': path = `/vendors/${id}`; break;
                  case 'lawyer': path = `/lawyers/${id}`; break;
                  case 'logistics': path = `/logistics/${id}`; break;
                  case 'currency-exchange': path = `/currency-exchange/${id}`; break;
                  case 'service': path = `/services/${id}`; break;
              }
              if (path) {
                  router.replace(path);
                  return; // Redirect and stop further processing
              }
          }
        }
        
        const associatedUser = await fetchUserByUid(user.uid);
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
    }
  }, [user, authLoading, router, isAdmin]);

  if (authLoading || loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Loading Profile...</p>
      </div>
    );
  }

  if (!user || !userData) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Could not load user data or you're being redirected.</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-12">
        <Card className="w-full max-w-lg shadow-xl">
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
                 { (
                   hasPendingApplication ? (
                     <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-center text-sm text-blue-800 flex items-center justify-center gap-2">
                        <Clock className="h-5 w-5"/>
                        <span>Your provider application is under review.</span>
                     </div>
                   ) : (
                    <Link href="/register" passHref>
                        <Button variant="outline" className="w-full mt-4">
                            Become a Vendor or Service Provider
                        </Button>
                    </Link>
                   )
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
