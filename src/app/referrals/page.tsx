

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { type UserData, createPayoutRequest } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Share2, Award, Banknote, Users, Check, UserCheck, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { BankAccountForm } from '@/components/referrals/BankAccountForm';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';


const PAYOUT_MINIMUM = 5000;

type ReferralEntry = { uid: string; fullName: string; };

export default function ReferralsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const unsub = onSnapshot(doc(db, "users", user.uid), async (doc) => {
        if (doc.exists()) {
            const fetchedUser = { id: doc.id, ...doc.data() } as UserData;
            setUserData(fetchedUser);
        }
        if(loadingData) setLoadingData(false);
    });

    return () => unsub();

  }, [user, authLoading, router, toast, loadingData]);

  const copyToClipboard = () => {
    if (!userData?.referralCode) return;
    const referralLink = `https://www.elitehubng.com/signup?ref=${userData.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setIsCopied(true);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard.",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleBankDetailsUpdate = (details: { accountName: string; accountNumber: string; bankName: string; }) => {
    if (!userData) return;
    const userRef = doc(db, 'users', userData.id);
    updateDoc(userRef, {
      accountName: details.accountName,
      accountNumber: details.accountNumber,
      bankName: details.bankName,
    });
    setUserData(prev => prev ? ({ ...prev, ...details }) : null);
  };

  const handlePayoutRequest = async () => {
     if (!userData || !user) return;
     if ((userData.referralBalance || 0) < PAYOUT_MINIMUM) {
        toast({ variant: 'destructive', title: 'Minimum payout not reached' });
        return;
     }
     if (!userData.accountNumber || !userData.bankName || !userData.accountName) {
        toast({ variant: 'destructive', title: 'Bank details required', description: 'Please add your bank account details first.' });
        return;
     }
     
     try {
        await createPayoutRequest({
            userId: user.uid,
            userName: userData.fullName,
            userEmail: userData.email,
            amount: userData.referralBalance,
            bankName: userData.bankName,
            accountNumber: userData.accountNumber,
            accountName: userData.accountName
        });
        toast({ title: 'Payout Request Sent!', description: 'Admin has been notified. Your request will be processed shortly.' });
     } catch (error: any) {
        console.error("Payout request failed:", error);
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not send payout request.' });
     }
  }


  if (authLoading || loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <p className="ml-4">Loading your referral data...</p>
      </div>
    );
  }

  if (!userData) {
    return <p className="text-center">Could not load user data.</p>;
  }

  const currentBalance = userData.referralBalance || 0;
  const progressPercentage = Math.min((currentBalance / PAYOUT_MINIMUM) * 100, 100);
  const canRequestPayout = currentBalance >= PAYOUT_MINIMUM;
  const successfulReferrals: ReferralEntry[] = userData.successfulReferrals || [];
  const pendingReferrals: ReferralEntry[] = userData.pendingReferrals || [];

  return (
      <div className="space-y-8 max-w-4xl mx-auto">
          <header>
            <h1 className="text-4xl font-bold font-headline tracking-tight text-foreground flex items-center gap-3">
                <Share2 className="h-10 w-10 text-primary" />
                My Referrals
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Invite a provider to subscribe, and you both earn ₦1,000.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Referral Balance</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₦{currentBalance.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Progress to ₦5,000 payout</p>
                    <Progress value={progressPercentage} className="w-full mt-2" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Successful Referrals</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{successfulReferrals.length}</div>
                    <p className="text-xs text-muted-foreground">Users who subscribed via your link</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Referrals</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{pendingReferrals.length}</div>
                    <p className="text-xs text-muted-foreground">Users who signed up but haven't subscribed</p>
                </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
                <CardTitle>Your Referral Link</CardTitle>
                <CardDescription>Share this link with potential vendors, lawyers, and service providers. When they sign up and subscribe, you both earn!</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted rounded-lg">
                <p className="text-lg font-mono text-primary break-all">https://www.elitehubng.com/signup?ref={userData.referralCode || 'N/A'}</p>
                <Button onClick={copyToClipboard} className="w-full sm:w-auto" disabled={!userData.referralCode}>
                    {isCopied ? <Check className="mr-2 h-4 w-4"/> : <Copy className="mr-2 h-4 w-4"/>}
                    {isCopied ? 'Copied!' : 'Copy Link'}
                </Button>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Payout Information</CardTitle>
                    <CardDescription>Add your bank details to receive your earnings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <BankAccountForm
                        user={userData}
                        onUpdate={handleBankDetailsUpdate}
                    />
                    <Button onClick={handlePayoutRequest} disabled={!canRequestPayout} className="w-full">
                        {canRequestPayout ? `Request Payout of ₦${currentBalance.toLocaleString()}` : `Reach ₦5,000 to Request Payout`}
                    </Button>
                </CardContent>
            </Card>

             <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-green-500" />Successful Referrals ({successfulReferrals.length})</CardTitle>
                        <CardDescription>Users who subscribed using your code.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {successfulReferrals.length > 0 ? (
                            <div className="border rounded-md max-h-40 overflow-y-auto">
                                <ul className="divide-y">
                                    {successfulReferrals.map(refUser => (
                                        <li key={refUser.uid} className="p-3 flex items-center justify-between">
                                            <p className="font-semibold">{refUser.fullName}</p>
                                            <p className="text-sm text-green-600 font-semibold">+ ₦1,000</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No successful referrals yet.
                            </div>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-amber-500" />Pending Referrals ({pendingReferrals.length})</CardTitle>
                        <CardDescription>Users who registered with your code but haven't subscribed yet.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {pendingReferrals.length > 0 ? (
                            <div className="border rounded-md max-h-40 overflow-y-auto">
                                <ul className="divide-y">
                                    {pendingReferrals.map(refUser => (
                                        <li key={refUser.uid} className="p-3 flex items-center justify-between">
                                            <p className="font-semibold">{refUser.fullName}</p>
                                            <p className="text-sm text-muted-foreground">Pending</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No pending referrals.
                            </div>
                        )}
                    </CardContent>
                </Card>
             </div>
          </div>
      </div>
  );
}
