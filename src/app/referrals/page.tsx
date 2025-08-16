
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { fetchVendorByUid, fetchVendors, type Vendor } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, Copy, Check, Share2, Award, Star, Gem, Crown, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const referralTiers = [
    { count: 10, reward: '10 Free Posts', icon: UserPlus },
    { count: 50, reward: 'Free Verified Badge (1 Year)', icon: Star },
    { count: 100, reward: 'Free VIP Badge', icon: Crown },
    { count: 150, reward: 'Free VVIP Badge', icon: Gem },
];

export default function ReferralsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [referredVendors, setReferredVendors] = useState<Vendor[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      const loadInitialData = async () => {
        const associatedVendor = await fetchVendorByUid(user.uid);
        if (associatedVendor) {
          setVendor(associatedVendor);
          if (associatedVendor.referrals && associatedVendor.referrals.length > 0) {
            const allVendors = await fetchVendors();
            const filtered = allVendors.filter(v => associatedVendor.referrals.includes(v.id));
            setReferredVendors(filtered);
          }
        } else {
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You must be a vendor to access this page.',
          });
          router.push('/profile');
        }
        setLoadingData(false);
      };
      
      loadInitialData();
    }
  }, [user, authLoading, router, toast]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Referral code has been copied to your clipboard.",
    });
  };

  if (authLoading || loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <p className="ml-4">Loading your referral data...</p>
      </div>
    );
  }
  
  if (!vendor) {
    return <p className="text-center">Redirecting...</p>
  }
  
  const referralCount = vendor.referrals?.length || 0;

  return (
      <div className="space-y-8">
          <header>
            <h1 className="text-4xl font-bold font-headline tracking-tight text-foreground flex items-center gap-3">
                <Share2 className="h-10 w-10 text-primary" />
                My Referrals
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Track your referrals and see the rewards you've earned.
            </p>
          </header>

          <Card>
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <p className="text-sm text-muted-foreground">Your Unique Referral Code</p>
                    <p className="text-2xl font-bold font-mono text-primary">{vendor.referralCode}</p>
                </div>
                <Button onClick={() => copyToClipboard(vendor.referralCode)}>
                    <Copy className="mr-2 h-4 w-4"/>
                    Copy Code
                </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>Referral Roadmap</CardTitle>
                <CardDescription>The more you refer, the more you earn! Here's what you can get.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {referralTiers.map((tier, index) => {
                    const isClaimed = vendor.claimedReferralTiers?.includes(tier.count);
                    const prevTierCount = index > 0 ? referralTiers[index - 1].count : 0;
                    const progress = Math.max(0, referralCount - prevTierCount);
                    const goal = tier.count - prevTierCount;
                    const progressPercentage = Math.min((progress / goal) * 100, 100);

                    return (
                        <div key={tier.count} className="space-y-2">
                             <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "flex h-8 w-8 items-center justify-center rounded-full",
                                        isClaimed ? "bg-green-500 text-white" : "bg-primary/20 text-primary"
                                    )}>
                                       {isClaimed ? <Check/> : <tier.icon className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{tier.reward}</p>
                                        <p className="text-sm text-muted-foreground">Reach {tier.count} referrals</p>
                                    </div>
                                </div>
                                {isClaimed && <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Claimed</Badge>}
                            </div>
                            {!isClaimed && (
                                <>
                                    <Progress value={progressPercentage} className="h-2" />
                                    <p className="text-xs text-muted-foreground text-right">{referralCount} / {tier.count} referrals</p>
                                </>
                            )}
                        </div>
                    );
                })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>Your Referred Vendors ({referralCount})</CardTitle>
                <CardDescription>List of vendors who joined using your referral code.</CardDescription>
            </CardHeader>
            <CardContent>
                 {referredVendors.length > 0 ? (
                    <div className="border rounded-md">
                        <ul className="divide-y">
                            {referredVendors.map(v => (
                                <li key={v.id} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Image src={v.profileImage} alt={v.name} width={40} height={40} className="rounded-full" />
                                        <div>
                                            <p className="font-semibold">{v.name}</p>
                                            <p className="text-sm text-muted-foreground">Member since: {v.memberSince}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={`/vendors/${v.id}`} target="_blank">View Profile</a>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="text-center py-16 text-muted-foreground">
                        You haven't referred any vendors yet. Share your code to get started!
                    </div>
                )}
            </CardContent>
          </Card>
      </div>
  );
}
