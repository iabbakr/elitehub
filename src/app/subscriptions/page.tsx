

'use client';

import { useState, useEffect } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Vendor, Transaction, ServiceProvider, Lawyer, CurrencyExchangeAgent, LogisticsCompany } from '@/lib/data';
import { fetchVendorByUid, createTransaction, fetchTransactionsByVendorId, checkIfUserIsAlreadyProvider, fetchProviderDataByUid } from '@/lib/data';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { add } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ShieldCheck, PlusCircle, TrendingUp, Zap, Loader2, Gem, Crown, Receipt, Eye, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Timestamp } from 'firebase/firestore';

type ProviderData = ServiceProvider | Lawyer | CurrencyExchangeAgent | LogisticsCompany;
type ProviderType = 'service' | 'lawyer' | 'currency-exchange' | 'logistics';

// VENDOR PLANS
const vipPlans = [
    { title: 'VIP Package', price: 100000, icon: Crown, features: ['30 Post Package Included', 'Official Verification Badge', 'Exclusive VIP Profile Badge', '1-Month Boost for 10 Products'], handler: 'handleVipPurchase', tier: 'vip' as const },
    { title: 'VVIP Package', price: 150000, icon: Gem, features: ['Unlimited Product Posts', 'Official Verification Badge', 'Exclusive VVIP Profile Badge', '2-Month Boost on All New Posts'], handler: 'handleVvipPurchase', tier: 'vvip' as const }
];
const badgePlans = [
    { duration: 3, price: 3000, title: '3 Months', features: ['Official verification badge', 'Increased trust with buyers', 'Priority support'] },
    { duration: 6, price: 5000, title: '6 Months', features: ['All benefits of 3-month plan', '5% discount on ad placements', 'Early access to new features'] },
    { duration: 12, price: 10000, title: '12 Months', features: ['Best value plan', '10% discount on ad placements', 'Vendor spotlight opportunities'] },
];
const postPackages = [
    { amount: 20, price: 5000, title: '20 Posts', description: 'Perfect for starting out.' },
    { amount: 50, price: 10000, title: '50 Posts', description: 'Great for growing businesses.' },
    { amount: 100, price: 30000, title: '100 Posts', description: 'For high-volume sellers.' },
    { amount: -1, price: 50000, title: 'Unlimited Posts', description: 'The ultimate freedom to sell.' }, // -1 for unlimited
];
const adPlans = [
    { boosts: 5, duration: '1 Week', price: 3000, description: 'Feature your products at the top of search results for a full week.' },
    { boosts: 12, duration: '2 Weeks', price: 5000, description: 'Maximize visibility with a two-week boosted placement.' },
    { boosts: 30, duration: '1 Month', price: 10000, description: 'Dominate the marketplace with a full month of top ad placement.' },
];

// CURRENCY EXCHANGE PLANS
const currencyExchangeVvipPlan = { 
    tier: 'vvip' as const, 
    price: 150000, 
    title: 'VVIP Annual Subscription', 
    description: 'Unlock your profile and gain maximum visibility and trust on the platform with our all-inclusive annual VVIP package.',
    features: ['1-Year Profile Visibility', 'Exclusive VVIP Badge', 'Official Verification Badge'],
    icon: Gem, 
    duration: 12 
};

// LOGISTICS PLANS
const logisticsFlightAndTrainPlans = [
    { duration: 1, price: 10000, title: '1 Month Profile Visibility', description: 'Activate your profile for 30 days.' },
    { duration: 6, price: 50000, title: '6 Months Profile Visibility', description: 'A great value for long-term presence.' },
    { duration: 12, price: 100000, title: '1 Year Profile Visibility', description: 'Our best deal for maximum visibility.' },
];
const logisticsCarPlans = [
    { duration: 1, price: 8000, title: '1 Month Profile Visibility', description: 'Activate your profile for 30 days.' },
    { duration: 6, price: 30000, title: '6 Months Profile Visibility', description: 'A great value for long-term presence.' },
    { duration: 12, price: 80000, title: '1 Year Profile Visibility', description: 'Our best deal for maximum visibility.' },
];
const logisticsDispatchPlans = [
    { duration: 1, price: 5000, title: '1 Month Profile Visibility', description: 'Activate your profile for 30 days.' },
    { duration: 6, price: 25000, title: '6 Months Profile Visibility', description: 'A great value for long-term presence.' },
    { duration: 12, price: 50000, title: '1 Year Profile Visibility', description: 'Our best deal for maximum visibility.' },
];
const logisticsVerificationPlans = [
    { duration: 1, price: 3000, title: '1 Month Verification', description: 'Add a verified badge to your profile to build trust with clients.' },
    { duration: 6, price: 15000, title: '6 Months Verification', description: 'A great value for long-term presence.' },
    { duration: 12, price: 30000, title: '1 Year Verification', description: 'Maximum credibility for a full year.' },
];
const logisticsVipPlans = [
    { tier: 'vip' as const, duration: 6, price: 80000, title: 'VIP Package (6 Months)', features: ['6 Months Profile Visibility', '6 Months Verification Badge', 'Boosted Profile Placement'] },
    { tier: 'vvip' as const, duration: 12, price: 150000, title: 'VVIP Package (1 Year)', features: ['1 Year Profile Visibility', '1 Year Verification Badge', 'Top Priority Profile Placement', 'Recommended to local users'] },
];


// LAWYER PLANS
const lawyerProfilePlans = [
    { duration: 1, price: 10000, title: '1 Month Profile Visibility', description: 'Activate your professional legal profile for one month.' },
    { duration: 6, price: 50000, title: '6 Months Profile Visibility', description: 'Activate your professional legal profile for half a year.' },
    { duration: 12, price: 100000, title: '1 Year Profile Visibility', description: 'Our best value for a full year of client access.' },
];
const lawyerVerificationPlans = [
    { duration: 1, price: 3000, title: '1 Month Verification', description: 'Get a verified badge on your profile to build trust.' },
    { duration: 6, price: 15000, title: '6 Months Verification', description: 'Get a verified badge on your profile to build trust.' },
    { duration: 12, price: 30000, title: '1 Year Verification', description: 'Long-term credibility at the best price.' },
];
const lawyerVipPlans = [
    { tier: 'vip' as const, duration: 6, price: 60000, title: 'VIP Package (6 Months)', features: ['6 Months Profile Visibility', '6 Months Verification Badge', 'VIP Profile Badge'] },
    { tier: 'vvip' as const, duration: 12, price: 150000, title: 'VVIP Package (1 Year)', features: ['1 Year Profile Visibility', '1 Year Verification Badge', 'VVIP Profile Badge', 'Top Profile Placement', 'Auto-recommendation for relevant transactions'] },
];

// SERVICE PROVIDER PLANS
const serviceVipPlans = [
    { tier: 'vip' as const, duration: 6, price: 50000, title: 'VIP Package', features: ['6 Months Profile Visibility', '6 Months Verification Badge', 'Standard Profile Boost', 'Up to 3 Gallery Photos'] },
    { tier: 'vvip' as const, duration: 12, price: 90000, title: 'VVIP Package', features: ['1 Year Profile Visibility', '1 Year Verification Badge', 'High-Priority Profile Boost', 'Up to 6 Gallery Photos', 'Top Profile Placement'] },
];

export default function SubscriptionsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [provider, setProvider] = useState<ProviderData | null>(null);
    const [providerType, setProviderType] = useState<ProviderType | null>(null);
    
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const refreshData = async (uid: string) => {
        const vendorData = await fetchVendorByUid(uid);
        if (vendorData) {
            setVendor(vendorData);
            const vendorTransactions = await fetchTransactionsByVendorId(vendorData.id);
            setTransactions(vendorTransactions);
        } else {
            const { providerData, type } = await fetchProviderDataByUid(uid);
            if (providerData && type) {
                setProvider(providerData as ProviderData);
                setProviderType(type as ProviderType);
                const providerTransactions = await fetchTransactionsByVendorId(providerData.id);
                setTransactions(providerTransactions);
            }
        }
    }


    useEffect(() => {
      if (!authLoading) {
        if (!user) {
          router.push('/login');
          return;
        }

        const getProfileData = async () => {
            const isProviderOrVendor = await checkIfUserIsAlreadyProvider(user.uid);
            if (isProviderOrVendor) {
              await refreshData(user.uid);
            } else {
              toast({ variant: 'destructive', title: 'Not a Provider', description: "This page is for registered vendors and service providers only." });
              router.push('/profile');
            }
            setLoadingData(false);
        };
        getProfileData();
      }
    }, [user, authLoading, router, toast]);

    // --- VENDOR HANDLERS ---
    const handleBadgeAssignment = async (vendorId: string, durationMonths: number) => {
        const badgeExpirationDate = add(new Date(), { months: durationMonths }).toISOString();
        await updateDoc(doc(db, "vendors", vendorId), { isVerified: true, badgeExpirationDate });
    };
    const handlePostPackageAssignment = async (vendorId: string, postsToAdd: number) => {
        if (!vendor) return;
        const newPostLimit = postsToAdd === -1 ? -1 : (vendor.postLimit === -1 ? -1 : (vendor.postLimit || 0) + postsToAdd);
        await updateDoc(doc(db, "vendors", vendorId), { postLimit: newPostLimit });
    };
    const handleAdBoostPurchase = async (vendorId: string, boostsToAdd: number) => {
        if (!vendor) return;
        const currentBoosts = vendor.adBoosts || 0;
        await updateDoc(doc(db, "vendors", vendorId), { adBoosts: currentBoosts + boostsToAdd });
    };
    const handleVipPurchase = async (vendorId: string) => {
        if (!vendor) return;
        const badgeExpirationDate = add(new Date(), { months: 12 }).toISOString();
        const postsToAdd = 30;
        const currentPostLimit = vendor.postLimit === -1 ? postsToAdd : (vendor.postLimit || 0) + postsToAdd;
        await updateDoc(doc(db, "vendors", vendorId), { isVerified: true, badgeExpirationDate, postLimit: currentPostLimit, tier: 'vip' });
    };
    const handleVvipPurchase = async (vendorId: string) => {
        const badgeExpirationDate = add(new Date(), { months: 12 }).toISOString();
        await updateDoc(doc(db, "vendors", vendorId), { isVerified: true, badgeExpirationDate, postLimit: -1, tier: 'vvip' });
    };
    const vendorPurchaseHandlers: { [key: string]: (vendorId: string) => Promise<void> } = { handleVipPurchase, handleVvipPurchase };

    // --- SERVICE PROVIDER HANDLERS ---
    const handleProfileVisibilityPurchase = async (providerId: string, durationMonths: number) => {
        const profileVisibleUntil = add(new Date(), { months: durationMonths }).toISOString();
        await updateDoc(doc(db, `${providerType!}s`, providerId), { profileVisibleUntil });
    };
    const handleProfileBoostPurchase = async (providerId: string, durationMonths: number) => {
        const boostedUntil = add(new Date(), { months: durationMonths }).toISOString();
        await updateDoc(doc(db, 'logisticsCompanies', providerId), { boostedUntil });
    };
    const handleGalleryAccessPurchase = async (providerId: string) => {
        const galleryActiveUntil = add(new Date(), { days: 30 }).toISOString();
        await updateDoc(doc(db, `${providerType!}s`, providerId), { galleryActiveUntil });
    };
    const handleServiceVerificationPurchase = async (providerId: string, durationMonths: number) => {
        const badgeExpirationDate = add(new Date(), { months: durationMonths }).toISOString();
        await updateDoc(doc(db, `${providerType!}s`, providerId), { isVerified: true, badgeExpirationDate });
    };
    const handleServiceVipPurchase = async (providerId: string, tier: 'vip' | 'vvip', durationMonths: number) => {
        const updates: any = { tier };
        updates.isVerified = true;
        updates.badgeExpirationDate = add(new Date(), { months: durationMonths }).toISOString();
        updates.profileVisibleUntil = add(new Date(), { months: durationMonths }).toISOString();
        updates.boostedUntil = add(new Date(), { months: durationMonths }).toISOString();

        if (providerType === 'service' || providerType === 'lawyer' || providerType === 'logistics') {
            await updateDoc(doc(db, `${providerType!}s`, providerId), updates);
        }
    };
    const handleCurrencyExchangeVipPurchase = async (providerId: string, tier: 'vip' | 'vvip', durationMonths: number) => {
        const updates: any = { tier };
        updates.isVerified = true;
        updates.badgeExpirationDate = add(new Date(), { months: durationMonths }).toISOString();
        updates.profileVisibleUntil = add(new Date(), { months: durationMonths }).toISOString();
        await updateDoc(doc(db, 'currencyExchangeAgents', providerId), updates);
    };


    const initiatePayment = (amount: number, onSuccessCallback: () => void, description: string, profileId: string) => {
        const userEmail = vendor?.email || provider?.email;
        if (!userEmail) {
            toast({ variant: 'destructive', title: 'Error', description: 'User details not found.' });
            return;
        }

        const amountInKobo = amount * 100;
        
        const config = {
            publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
            email: userEmail,
            amount: amountInKobo,
            reference: (new Date()).getTime().toString(),
        };

        const onPaymentSuccess = async (transaction: any) => {
          console.log('Paystack transaction:', transaction);
          await createTransaction(profileId, description, amount, providerType || 'vendor');
          toast({ title: 'Payment Successful', description: `Your purchase of "${description}" was successful.` });
          onSuccessCallback();
          if (user?.uid) refreshData(user.uid);
        };
      
        const onPaymentClose = () => {
            toast({ variant: 'destructive', title: 'Payment Cancelled' });
        };
      
        const initializePayment = usePaystackPayment(config);

        initializePayment({onSuccess: onPaymentSuccess, onClose: onPaymentClose});
    };

    const formatTimestamp = (timestamp: any): string => {
        if (!timestamp) return 'N/A';
        if (timestamp instanceof Timestamp) return timestamp.toDate().toLocaleString();
        return new Date(timestamp.seconds * 1000).toLocaleString();
    };
    
    const isDateActive = (dateString?: string | null) => {
        if (!dateString) return false;
        return new Date(dateString) > new Date();
    };

    if (authLoading || loadingData) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-4">Loading Subscriptions...</p></div>;
    }
    
    if (!vendor && !provider) {
        return <div className="text-center py-16"><p>Redirecting...</p></div>;
    }

    const renderVendorSubscriptions = () => (
        <>
            <section>
                <div className="text-center mb-8"><Gem className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">All-in-One Packages</h2><p className="mt-2 text-muted-foreground">Get the best value with our bundled VIP & VVIP plans.</p></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {vipPlans.map(plan => (
                        <Card key={plan.title} className="flex flex-col hover:shadow-2xl transition-shadow border-2 border-primary/20">
                            <CardHeader className="text-center items-center"><plan.icon className="h-10 w-10 text-primary" /><CardTitle className="text-3xl font-headline">{plan.title}</CardTitle></CardHeader>
                            <CardContent className="flex-grow space-y-4"><p className="text-5xl font-bold font-headline text-primary text-center">₦{plan.price.toLocaleString()}</p><ul className="space-y-2 text-sm text-muted-foreground pt-4">{plan.features.map(feature => (<li key={feature} className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>{feature}</span></li>))}</ul></CardContent>
                            <CardFooter><Button size="lg" className="w-full text-lg py-6" disabled={vendor!.tier === plan.tier} onClick={() => initiatePayment(plan.price, () => vendorPurchaseHandlers[plan.handler](vendor!.id), plan.title, vendor!.id)}>{vendor!.tier === plan.tier ? 'Purchased' : 'Purchase'}</Button></CardFooter>
                        </Card>
                    ))}
                </div>
            </section>

            <section>
                <div className="text-center mb-8"><ShieldCheck className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">Verification Badge</h2><p className="mt-2 text-muted-foreground">Become a trusted, verified vendor on EliteHub.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {badgePlans.map(plan => (
                    <Card key={plan.duration} className="flex flex-col hover:shadow-xl transition-shadow">
                    <CardHeader><CardTitle className="text-2xl">{plan.title}</CardTitle></CardHeader>
                    <CardContent className="flex-grow space-y-4"><p className="text-4xl font-bold font-headline text-primary">₦{plan.price.toLocaleString()}</p><ul className="space-y-2 text-sm text-muted-foreground">{plan.features.map(feature => (<li key={feature} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /><span>{feature}</span></li>))}</ul></CardContent>
                    <CardFooter><Button className="w-full" disabled={isDateActive(vendor?.badgeExpirationDate)} onClick={() => initiatePayment(plan.price, () => handleBadgeAssignment(vendor!.id, plan.duration), `Verification Badge (${plan.title})`, vendor!.id)}>{isDateActive(vendor?.badgeExpirationDate) ? 'Active' : 'Purchase'}</Button></CardFooter>
                    </Card>
                ))}
                </div>
            </section>

            <section>
                <div className="text-center mb-8"><PlusCircle className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">Post Packages</h2><p className="mt-2 text-muted-foreground">Increase your product listing limit.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {postPackages.map(pkg => (
                    <Card key={pkg.title} className="flex flex-col text-center hover:shadow-xl transition-shadow">
                    <CardHeader><CardTitle className="text-2xl">{pkg.title}</CardTitle><CardDescription>{pkg.description}</CardDescription></CardHeader>
                    <CardContent className="flex-grow flex items-center justify-center"><p className="text-4xl font-bold font-headline text-primary">₦{pkg.price.toLocaleString()}</p></CardContent>
                    <CardFooter><Button className="w-full" onClick={() => initiatePayment(pkg.price, () => handlePostPackageAssignment(vendor!.id, pkg.amount), `Post Package (${pkg.title})`, vendor!.id)}>Purchase</Button></CardFooter>
                    </Card>
                ))}
                </div>
            </section>

            <section>
                <div className="text-center mb-8"><TrendingUp className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">Top Ads & Boosted Posts</h2><p className="mt-2 text-muted-foreground">Get your products in front of more buyers.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {adPlans.map(plan => (
                    <Card key={plan.duration} className="flex flex-col hover:shadow-xl transition-shadow bg-muted/30">
                    <CardHeader><CardTitle className="text-2xl">{plan.duration} Boost</CardTitle><CardDescription>{plan.description}</CardDescription></CardHeader>
                    <CardContent className="flex-grow flex items-center justify-center"><p className="text-4xl font-bold font-headline text-primary">₦{plan.price.toLocaleString()}</p></CardContent>
                    <CardFooter><Button className="w-full" onClick={() => initiatePayment(plan.price, () => handleAdBoostPurchase(vendor!.id, plan.boosts), `Ad Boost (${plan.duration})`, vendor!.id)}>Purchase</Button></CardFooter>
                    </Card>
                ))}
                </div>
            </section>
        </>
    );

    const renderCurrencyExchangeSubscriptions = () => (
         <section>
            <div className="text-center mb-8">
                <currencyExchangeVvipPlan.icon className="mx-auto h-12 w-12 text-primary" />
                <h2 className="mt-4 text-3xl font-bold font-headline">{currencyExchangeVvipPlan.title}</h2>
                <p className="mt-2 text-muted-foreground">{currencyExchangeVvipPlan.description}</p>
            </div>
            <div className="flex justify-center">
                 <Card key={currencyExchangeVvipPlan.title} className="flex flex-col hover:shadow-2xl transition-shadow border-2 border-primary/20 max-w-md">
                    <CardHeader className="text-center items-center">
                        <currencyExchangeVvipPlan.icon className="h-10 w-10 text-primary" />
                        <CardTitle className="text-3xl font-headline">{currencyExchangeVvipPlan.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <p className="text-5xl font-bold font-headline text-primary text-center">₦{currencyExchangeVvipPlan.price.toLocaleString()}</p>
                        <ul className="space-y-2 text-sm text-muted-foreground pt-4">
                            {currencyExchangeVvipPlan.features.map(feature => (
                                <li key={feature} className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button 
                            size="lg" 
                            className="w-full text-lg py-6" 
                            disabled={isDateActive(provider?.profileVisibleUntil)} 
                            onClick={() => initiatePayment(currencyExchangeVvipPlan.price, () => handleCurrencyExchangeVipPurchase(provider!.id, currencyExchangeVvipPlan.tier, currencyExchangeVvipPlan.duration), currencyExchangeVvipPlan.title, provider!.id)}
                        >
                            {isDateActive(provider?.profileVisibleUntil) ? 'Active' : 'Subscribe Now'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </section>
    );
    
     const renderLogisticsSubscriptions = () => {
        const logisticsProvider = provider as LogisticsCompany;
        let currentPlans = logisticsDispatchPlans;
        if (logisticsProvider.category === 'International Flight' || logisticsProvider.category === 'Local Flight' || logisticsProvider.category === 'Train Logistics') {
            currentPlans = logisticsFlightAndTrainPlans;
        } else if (logisticsProvider.category === 'Car Logistics') {
            currentPlans = logisticsCarPlans;
        }

        return (
            <>
                <section>
                    <div className="text-center mb-8"><Eye className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">Profile Visibility for {logisticsProvider.category}</h2><p className="mt-2 text-muted-foreground">Choose a plan to make your profile visible to clients.</p></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {currentPlans.map(plan => (
                            <Card key={plan.duration} className="flex flex-col text-center hover:shadow-xl transition-shadow"><CardHeader><CardTitle>{plan.title}</CardTitle><CardDescription>{plan.description}</CardDescription></CardHeader><CardContent className="flex-grow flex items-center justify-center"><p className="text-4xl font-bold font-headline text-primary">₦{plan.price.toLocaleString()}</p></CardContent><CardFooter><Button className="w-full" disabled={isDateActive(provider?.profileVisibleUntil)} onClick={() => initiatePayment(plan.price, () => handleProfileVisibilityPurchase(provider!.id, plan.duration), plan.title, provider!.id)}>{isDateActive(provider?.profileVisibleUntil) ? 'Active' : 'Purchase'}</Button></CardFooter></Card>
                        ))}
                    </div>
                </section>
                <section>
                    <div className="text-center mb-8"><ShieldCheck className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">Verification Badge</h2><p className="mt-2 text-muted-foreground">Build trust and stand out from the crowd.</p></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {logisticsVerificationPlans.map(plan => (
                             <Card key={plan.duration} className="flex flex-col text-center hover:shadow-xl transition-shadow"><CardHeader><CardTitle>{plan.title}</CardTitle><CardDescription>{plan.description}</CardDescription></CardHeader><CardContent className="flex-grow flex items-center justify-center"><p className="text-4xl font-bold font-headline text-primary">₦{plan.price.toLocaleString()}</p></CardContent><CardFooter><Button className="w-full" disabled={isDateActive(provider?.badgeExpirationDate) && provider?.isVerified} onClick={() => initiatePayment(plan.price, () => handleServiceVerificationPurchase(provider!.id, plan.duration), plan.title, provider!.id)}>{isDateActive(provider?.badgeExpirationDate)  && provider?.isVerified ? 'Active' : 'Purchase'}</Button></CardFooter></Card>
                        ))}
                    </div>
                </section>
                 <section>
                    <div className="text-center mb-8"><Gem className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">All-in-One Packages</h2><p className="mt-2 text-muted-foreground">Get the best value with our bundled VIP & VVIP plans.</p></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                         {logisticsVipPlans.map(plan => (
                             <Card key={plan.tier} className="flex flex-col text-center hover:shadow-xl transition-shadow border-2 border-primary/20">
                               <CardHeader className="items-center"><CardTitle className="flex items-center justify-center gap-2">{plan.tier === 'vip' ? <Crown className="h-8 w-8 text-primary"/> : <Gem className="h-8 w-8 text-primary"/>}{plan.title}</CardTitle></CardHeader>
                               <CardContent className="flex-grow space-y-4">
                                  <p className="text-5xl font-bold font-headline text-primary text-center">₦{plan.price.toLocaleString()}</p>
                                  <ul className="space-y-2 text-sm text-muted-foreground pt-4">{plan.features.map(feature => (<li key={feature} className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>{feature}</span></li>))}</ul>
                                </CardContent>
                               <CardFooter><Button size="lg" className="w-full text-lg py-6" disabled={isDateActive(provider?.badgeExpirationDate) && provider?.tier === plan.tier} onClick={() => initiatePayment(plan.price, () => handleServiceVipPurchase(provider!.id, plan.tier, plan.duration), plan.title, provider!.id)}>{isDateActive(provider?.badgeExpirationDate) && provider?.tier === plan.tier ? 'Active' : 'Purchase'}</Button></CardFooter>
                            </Card>
                        ))}
                    </div>
                </section>
            </>
        )
     };

    const renderLawyerSubscriptions = () => (
        <>
            <section>
                <div className="text-center mb-8"><Eye className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">Profile Visibility</h2><p className="mt-2 text-muted-foreground">Choose a plan to make your profile visible to clients.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    {lawyerProfilePlans.map(plan => (
                        <Card key={plan.duration} className="flex flex-col text-center hover:shadow-xl transition-shadow">
                            <CardHeader><CardTitle>{plan.title}</CardTitle><CardDescription>{plan.description}</CardDescription></CardHeader>
                            <CardContent className="flex-grow flex items-center justify-center"><p className="text-4xl font-bold font-headline text-primary">₦{plan.price.toLocaleString()}</p></CardContent>
                            <CardFooter><Button className="w-full" disabled={isDateActive(provider?.profileVisibleUntil)} onClick={() => initiatePayment(plan.price, () => handleProfileVisibilityPurchase(provider!.id, plan.duration), plan.title, provider!.id)}>{isDateActive(provider?.profileVisibleUntil) ? 'Active' : 'Purchase'}</Button></CardFooter>
                        </Card>
                    ))}
                </div>
            </section>

             <section>
                <div className="text-center mb-8"><ShieldCheck className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">Profile Upgrades</h2><p className="mt-2 text-muted-foreground">Build trust and stand out with verification and VIP badges.</p></div>
                <div className="space-y-8">
                     <div>
                        <h3 className="text-xl font-semibold mb-4 text-center">Verification Badge</h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                            {lawyerVerificationPlans.map(plan => (
                                <Card key={plan.duration} className="flex flex-col text-center hover:shadow-xl transition-shadow">
                                    <CardHeader><CardTitle>{plan.title}</CardTitle><CardDescription>{plan.description}</CardDescription></CardHeader>
                                    <CardContent className="flex-grow flex items-center justify-center"><p className="text-4xl font-bold font-headline text-primary">₦{plan.price.toLocaleString()}</p></CardContent>
                                    <CardFooter><Button className="w-full" disabled={isDateActive(provider?.badgeExpirationDate) && provider?.isVerified} onClick={() => initiatePayment(plan.price, () => handleServiceVerificationPurchase(provider!.id, plan.duration), plan.title, provider!.id)}>{isDateActive(provider?.badgeExpirationDate)  && provider?.isVerified ? 'Active' : 'Purchase'}</Button></CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-xl font-semibold mb-4 text-center">VIP & VVIP Packages</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            {lawyerVipPlans.map(plan => (
                                 <Card key={`${plan.tier}-${plan.duration}`} className="flex flex-col text-center hover:shadow-xl transition-shadow border-2 border-primary/20">
                                    <CardHeader className="items-center"><CardTitle className="flex items-center justify-center gap-2">{plan.tier === 'vip' ? <Crown className="h-8 w-8 text-primary"/> : <Gem className="h-8 w-8 text-primary"/>}{plan.title}</CardTitle></CardHeader>
                                    <CardContent className="flex-grow space-y-4">
                                        <p className="text-5xl font-bold font-headline text-primary text-center">₦{plan.price.toLocaleString()}</p>
                                        <ul className="space-y-2 text-sm text-muted-foreground pt-4">{plan.features.map(feature => (<li key={feature} className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>{feature}</span></li>))}</ul>
                                    </CardContent>
                                    <CardFooter><Button size="lg" className="w-full text-lg py-6" disabled={isDateActive(provider?.badgeExpirationDate) && provider?.tier === plan.tier} onClick={() => initiatePayment(plan.price, () => handleServiceVipPurchase(provider!.id, plan.tier, plan.duration), plan.title, provider!.id)}>{isDateActive(provider?.badgeExpirationDate) && provider?.tier === plan.tier ? 'Active' : 'Purchase'}</Button></CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
             </section>
        </>
    );
    
    const renderServiceSubscriptions = () => (
         <section>
            <div className="text-center mb-8"><Gem className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">All-in-One Packages</h2><p className="mt-2 text-muted-foreground">Get the best value with our bundled VIP & VVIP plans.</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {serviceVipPlans.map(plan => (
                    <Card key={plan.tier} className="flex flex-col text-center hover:shadow-xl transition-shadow border-2 border-primary/20">
                        <CardHeader className="items-center"><CardTitle className="flex items-center justify-center gap-2">{plan.tier === 'vip' ? <Crown className="h-8 w-8 text-primary"/> : <Gem className="h-8 w-8 text-primary"/>}{plan.title}</CardTitle></CardHeader>
                        <CardContent className="flex-grow space-y-4">
                            <p className="text-5xl font-bold font-headline text-primary text-center">₦{plan.price.toLocaleString()}</p>
                            <ul className="space-y-2 text-sm text-muted-foreground pt-4">{plan.features.map(feature => (<li key={feature} className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>{feature}</span></li>))}</ul>
                        </CardContent>
                        <CardFooter><Button size="lg" className="w-full text-lg py-6" disabled={isDateActive(provider?.badgeExpirationDate) && provider?.tier === plan.tier} onClick={() => initiatePayment(plan.price, () => handleServiceVipPurchase(provider!.id, plan.tier, plan.duration), plan.title, provider!.id)}>{isDateActive(provider?.badgeExpirationDate) && provider?.tier === plan.tier ? 'Active' : 'Purchase'}</Button></CardFooter>
                    </Card>
                ))}
            </div>
        </section>
    );

    const renderSubscriptions = () => {
        if (vendor) return renderVendorSubscriptions();
        if (providerType === 'logistics') return renderLogisticsSubscriptions();
        if (providerType === 'lawyer') return renderLawyerSubscriptions();
        if (providerType === 'service') return renderServiceSubscriptions();
        if (providerType === 'currency-exchange') return renderCurrencyExchangeSubscriptions();
        return null;
    }

    return (
        <div className="space-y-16">
            <header className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground">
                    Grow Your Business
                </h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                    Upgrade your account with our powerful subscription plans to sell more, faster.
                </p>
            </header>

            {renderSubscriptions()}

            {/* Transaction History */}
            <section>
                <div className="text-center mb-8"><Receipt className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">Transaction History</h2><p className="mt-2 text-muted-foreground">A record of all your purchases and subscriptions.</p></div>
                <Card className="shadow-xl">
                    <CardContent className="pt-6">
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {transactions.length > 0 ? (
                                        transactions.map(tx => (<TableRow key={tx.id}><TableCell>{formatTimestamp(tx.timestamp)}</TableCell><TableCell className="font-medium">{tx.description}</TableCell><TableCell className="text-right font-semibold">₦{tx.amount.toLocaleString()}</TableCell></TableRow>))
                                    ) : ( <TableRow><TableCell colSpan={3} className="h-24 text-center">You have no transaction history yet.</TableCell></TableRow> )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
