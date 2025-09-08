

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Vendor, Transaction, ServiceProvider, Lawyer, CurrencyExchangeAgent, LogisticsCompany, Product, UserData } from '@/lib/data';
import { createTransaction, fetchProviderDataByUid, fetchProductsByVendorId, fetchUserByUid } from '@/lib/data';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment, writeBatch } from 'firebase/firestore';
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
import type { PaystackProps } from 'react-paystack/dist/types';
import { handleSuccessfulSubscriptionReferral } from '@/lib/functions';

type ProviderData = Vendor | ServiceProvider | Lawyer | CurrencyExchangeAgent | LogisticsCompany;
type ProviderType = 'service' | 'lawyer' | 'currency-exchange' | 'logistics' | 'vendor' | null;

// --- VENDOR PLANS ---
const vipPlans = [
    { 
        title: 'VIP Package', 
        price: 150000, 
        icon: Crown, 
        features: [
            '60 Post Credits Included', 
            '6-Month Official Verification Badge', 
            'Exclusive VIP Profile Badge', 
            '6-Month Boost for ALL Products',
            'Featured in search results'
        ], 
        tier: 'vip' as const 
    },
    { 
        title: 'VVIP Package', 
        price: 300000, 
        icon: Gem, 
        features: [
            'Unlimited Product Posts', 
            '12-Month Official Verification Badge', 
            'Exclusive VVIP Profile Badge', 
            '12-Month Boost for ALL Products', 
            'Top placement in all searches'
        ], 
        tier: 'vvip' as const 
    }
];

const badgePlans = [
    { duration: 3, price: 3000, title: '3 Months', features: ['Official verification badge', 'Increased trust with buyers', 'Priority support'] },
    { duration: 6, price: 5000, title: '6 Months', features: ['All benefits of 3-month plan', '5% discount on ad placements', 'Early access to new features'] },
    { duration: 12, price: 10000, title: '12 Months', features: ['Best value plan', '10% discount on ad placements', 'Vendor spotlight opportunities'] },
];
const postPackages = [
    { amount: 5, price: 5000, title: '5 Posts', description: 'For starting out.' },
    { amount: 10, price: 10000, title: '10 Posts', description: 'For small businesses.' },
    { amount: 20, price: 20000, title: '20 Posts', description: 'For growing businesses.' },
    { amount: 50, price: 50000, title: '50 Posts', description: 'For high-volume sellers.' },
];
const adPlans = [
    { boosts: 5, duration: '1 Week', price: 3000, description: 'Feature your products at the top of search results for a full week.' },
    { boosts: 12, duration: '2 Weeks', price: 5000, description: 'Maximize visibility with a two-week boosted placement.' },
    { boosts: 30, duration: '1 Month', price: 10000, description: 'Dominate the marketplace with a full month of top ad placement.' },
];

// --- SERVICE PROVIDER PLANS ---
const serviceProfileVisibilityPlans = [
    { duration: 1, price: 5000, title: '1 Month Profile Visibility' },
    { duration: 3, price: 15000, title: '3 Months Profile Visibility' },
    { duration: 6, price: 30000, title: '6 Months Profile Visibility' },
    { duration: 12, price: 80000, title: '1 Year Profile Visibility' },
];

const serviceVerificationPlans = [
    { duration: 1, price: 3000, title: '1 Month Verification Badge' },
    { duration: 3, price: 9000, title: '3 Months Verification Badge' },
    { duration: 6, price: 18000, title: '6 Months Verification Badge' },
    { duration: 12, price: 30000, title: '1 Year Verification Badge' },
];

const serviceVipTiers = [
    { 
        tier: 'vip' as const, 
        duration: 6, 
        price: 50000, 
        title: 'VIP Package',
        icon: Crown,
        features: ['6 Months Profile Visibility & Boost', '6 Months Verification Badge', 'VIP Profile Badge', 'Up to 3 Gallery Photos'] 
    },
    { 
        tier: 'vvip' as const, 
        duration: 12, 
        price: 100000, 
        title: 'VVIP Package',
        icon: Gem,
        features: ['1 Year Profile Visibility', '1 Year Verification Badge', 'VVIP Profile Badge & "Highly Recommended"', 'Top placement in all searches', 'Up to 6 Gallery Photos'] 
    }
];

// --- LAWYER PLANS ---
const lawyerProfilePlans = [
    { duration: 1, price: 10000, title: '1 Month Profile Visibility' },
    { duration: 3, price: 30000, title: '3 Months Profile Visibility' },
    { duration: 6, price: 60000, title: '6 Months Profile Visibility' },
    { duration: 12, price: 100000, title: '1 Year Profile Visibility' },
];
const lawyerVerificationPlans = [
    { duration: 1, price: 3000, title: '1 Month Verification Badge' },
    { duration: 3, price: 9000, title: '3 Months Verification Badge' },
    { duration: 6, price: 18000, title: '6 Months Verification Badge' },
    { duration: 12, price: 30000, title: '1 Year Verification Badge' },
];
const lawyerVipPlans = [
    { tier: 'vip' as const, duration: 6, price: 80000, title: 'VIP Package (6 Months)', icon: Crown, features: ['6 Months Profile Visibility', '6 Months Verification Badge', 'VIP Profile Badge', 'Profile Boost'] },
    { tier: 'vvip' as const, duration: 12, price: 150000, title: 'VVIP Package (1 Year)', icon: Gem, features: ['1 Year Profile Visibility', '1 Year Verification Badge', 'VVIP Profile Badge', 'Top placement in all searches', '"Highly Recommended" Tag'] }
];

// --- LOGISTICS PLANS ---
const logisticsProfileVisibilityPlans = [
    { duration: 1, price: 5000, title: '1 Month Profile Visibility' },
    { duration: 3, price: 15000, title: '3 Months Profile Visibility' },
    { duration: 6, price: 30000, title: '6 Months Profile Visibility' },
    { duration: 12, price: 80000, title: '1 Year Profile Visibility' },
];
const logisticsVerificationPlans = [
    { duration: 1, price: 3000, title: '1 Month Verification & Boost' },
    { duration: 3, price: 9000, title: '3 Months Verification & Boost' },
    { duration: 6, price: 18000, title: '6 Months Verification & Boost' },
    { duration: 12, price: 30000, title: '1 Year Verification & Boost' },
];
const logisticsVipTiers = [
    { 
        tier: 'vip' as const, 
        duration: 6, 
        price: 50000, 
        title: 'VIP Package',
        icon: Crown,
        features: ['6 Months Profile Visibility & Boost', '6 Months Verification Badge', 'VIP Profile Badge', 'Up to 3 Gallery Photos'] 
    },
    { 
        tier: 'vvip' as const, 
        duration: 12, 
        price: 100000, 
        title: 'VVIP Package',
        icon: Gem,
        features: ['1 Year Profile Visibility', '1 Year Verification Badge', 'VVIP Profile Badge & "Highly Recommended"', 'Top placement in all searches', 'Up to 6 Gallery Photos'] 
    }
];


// --- OTHER PROVIDER PLANS ---
const currencyExchangeVvipPlan = { tier: 'vvip' as const, price: 150000, title: 'VVIP Annual Subscription', description: 'Unlock your profile and gain maximum visibility and trust on the platform with our all-inclusive annual VVIP package.', features: ['1-Year Profile Visibility', 'Exclusive VVIP Badge', 'Official Verification Badge'], icon: Gem, duration: 12 };

interface PaystackButtonProps {
    email: string;
    title: string;
    price: number;
    onSuccess: (reference: string) => void;
    children: React.ReactNode;
    size?: 'default' | 'lg';
    disabled?: boolean;
}

const PaystackButton = ({ email, title, price, onSuccess, children, size = 'default', disabled = false }: PaystackButtonProps) => {
    const { toast } = useToast();
    const config: PaystackProps = {
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        email,
        amount: price * 100,
        currency: 'NGN',
        reference: new Date().getTime().toString(),
    };
    
    const initializePayment = usePaystackPayment(config);

    const handlePayment = () => {
        initializePayment({
            onSuccess: (response) => onSuccess(response.reference),
            onClose: () => {
                toast({ variant: 'destructive', title: 'Payment Cancelled' });
            },
        });
    };

    return <Button onClick={handlePayment} disabled={disabled} size={size} className="w-full">{children}</Button>;
};

export default function SubscriptionsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [profile, setProfile] = useState<ProviderData | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [providerType, setProviderType] = useState<ProviderType>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const refreshData = useCallback(async (uid: string) => {
        const { providerData, type, transactions: providerTransactions } = await fetchProviderDataByUid(uid);
        const fetchedUser = await fetchUserByUid(uid);
        setProfile(providerData);
        setProviderType(type as ProviderType);
        setUserData(fetchedUser);
        if(providerTransactions) setTransactions(providerTransactions);
    }, []);

    useEffect(() => {
      if (!authLoading) {
        if (!user) {
          router.push('/login');
          return;
        }
        fetchProviderDataByUid(user.uid).then(async ({ providerData, type, transactions }) => {
            if (providerData && type) {
                setProfile(providerData);
                setProviderType(type as ProviderType);
                if (transactions) setTransactions(transactions);
                const fetchedUser = await fetchUserByUid(user.uid);
                setUserData(fetchedUser);
            } else {
                toast({ variant: 'destructive', title: 'Not a Provider', description: "This page is for registered providers only." });
                router.push('/profile');
            }
            setLoadingData(false);
        });
      }
    }, [user, authLoading, router, toast]);

    const handlePaymentSuccess = async (reference: string, description: string, price: number, action: () => Promise<void>) => {
        if (!profile || !providerType || !user) return;
        toast({ title: "Payment Received!", description: "Verifying transaction..."});
        
        try {
            // Backend verification
            const verifyRes = await fetch(`/api/paystack/verify?reference=${reference}`);
            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.message || 'Transaction verification failed.');
            }

            toast({ title: 'Verification Successful!', description: 'Updating your account...' });

            await action();
            // Handle referral bonus after the primary action is successful
            await handleSuccessfulSubscriptionReferral(user.uid);
            await createTransaction(profile.id, user.uid, description, price, providerType);
            await refreshData(user.uid);
            toast({ title: 'Account Updated!', description: `Your purchase of "${description}" is complete.` });

        } catch (error: any) {
            console.error("Error processing purchase:", error);
            toast({ variant: 'destructive', title: 'Error Processing Purchase', description: error.message || 'There was a problem updating your account.' });
        }
    };
    
    const handleVipPurchase = async (plan: typeof vipPlans[0]) => {
        if (!profile || profile.id === undefined) return;
        const isVip = plan.tier === 'vip';
        const postIncrement = isVip ? 60 : -1;
        const boostDuration = isVip ? 6 : 12; // months
        const verificationDuration = isVip ? 6 : 12; // months

        const vendorRef = doc(db, getCollectionName(), profile.id);
        const products = await fetchProductsByVendorId(profile.id);
        
        const batch = writeBatch(db);

        // Update vendor document
        const vendorUpdates: any = {
            tier: plan.tier,
            isVerified: true,
            badgeExpirationDate: add(new Date(), { months: verificationDuration }).toISOString(),
        };
        if (postIncrement === -1) {
            vendorUpdates.postLimit = -1;
        } else {
            vendorUpdates.postLimit = increment(postIncrement);
        }
        batch.update(vendorRef, vendorUpdates);

        // Update all existing products with boost
        const boostExpirationDate = add(new Date(), { months: boostDuration }).toISOString();
        products.forEach((product: Product) => {
            const productRef = doc(db, 'products', product.id);
            batch.update(productRef, { boostedUntil: boostExpirationDate });
        });

        await batch.commit();
    };

    const handleServiceVipTierPurchase = async (plan: typeof serviceVipTiers[0]) => {
        if (!profile || profile.id === undefined) return;
        const providerRef = doc(db, getCollectionName(), profile.id);
        
        const updates: Partial<ServiceProvider> = {
            tier: plan.tier,
            isVerified: true,
            badgeExpirationDate: add(new Date(), { months: plan.duration }).toISOString(),
            profileVisibleUntil: add(new Date(), { months: plan.duration }).toISOString(),
            boostedUntil: add(new Date(), { months: plan.duration }).toISOString(),
            galleryActiveUntil: add(new Date(), { months: plan.duration }).toISOString(),
        };

        await updateDoc(providerRef, updates);
    };

    const handleLogisticsVipTierPurchase = async (plan: typeof logisticsVipTiers[0]) => {
        if (!profile || profile.id === undefined) return;
        const providerRef = doc(db, getCollectionName(), profile.id);
        
        const updates: Partial<LogisticsCompany> = {
            tier: plan.tier,
            isVerified: true,
            badgeExpirationDate: add(new Date(), { months: plan.duration }).toISOString(),
            profileVisibleUntil: add(new Date(), { months: plan.duration }).toISOString(),
            boostedUntil: add(new Date(), { months: plan.duration }).toISOString(),
            galleryActiveUntil: add(new Date(), { months: plan.duration }).toISOString(),
        };

        await updateDoc(providerRef, updates);
    };
    
    const handleLawyerVipTierPurchase = async (plan: typeof lawyerVipPlans[0]) => {
        if (!profile || profile.id === undefined) return;
        const providerRef = doc(db, getCollectionName(), profile.id);
        
        const updates: Partial<Lawyer> = {
            tier: plan.tier,
            isVerified: true,
            badgeExpirationDate: add(new Date(), { months: plan.duration }).toISOString(),
            profileVisibleUntil: add(new Date(), { months: plan.duration }).toISOString(),
            boostedUntil: add(new Date(), { months: plan.duration }).toISOString(),
        };

        await updateDoc(providerRef, updates);
    };

    const handleCurrencyExchangeVipPurchase = async (plan: typeof currencyExchangeVvipPlan) => {
        if (!profile || profile.id === undefined) return;
        const providerRef = doc(db, getCollectionName(), profile.id);
        
        const updates: Partial<CurrencyExchangeAgent> = {
            tier: plan.tier,
            isVerified: true,
            badgeExpirationDate: add(new Date(), { months: plan.duration }).toISOString(),
            profileVisibleUntil: add(new Date(), { months: plan.duration }).toISOString(),
        };

        await updateDoc(providerRef, updates);
    };

    const isDateActive = (dateString?: string | null) => dateString ? new Date(dateString) > new Date() : false;
    const formatTimestamp = (timestamp: any): string => timestamp instanceof Timestamp ? timestamp.toDate().toLocaleString() : new Date(timestamp.seconds * 1000).toLocaleString();

    const getCollectionName = () => {
        switch(providerType) {
            case 'vendor': return 'vendors';
            case 'lawyer': return 'lawyers';
            case 'logistics': return 'logisticsCompanies';
            case 'service': return 'serviceProviders';
            case 'currency-exchange': return 'currencyExchangeAgents';
            default: throw new Error("Invalid provider type");
        }
    }

    const renderVendorSubscriptions = () => (
        <>
            <section>
                 <div className="text-center mb-8"><PlusCircle className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">Post Packages</h2></div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {postPackages.map(pkg => (
                         <Card key={pkg.title} className="flex flex-col text-center hover:shadow-xl transition-shadow">
                             <CardHeader><CardTitle className="text-2xl">{pkg.title}</CardTitle><CardDescription>{pkg.description}</CardDescription></CardHeader>
                             <CardContent className="flex-grow flex items-center justify-center"><p className="text-4xl font-bold font-headline text-primary">₦{pkg.price.toLocaleString()}</p></CardContent>
                             <CardFooter>
                                <PaystackButton email={user!.email!} title={`Post Package (${pkg.title})`} price={pkg.price} onSuccess={(ref) => handlePaymentSuccess(ref, `Post Package (${pkg.title})`, pkg.price, () => updateDoc(doc(db, getCollectionName(), profile!.id), { postLimit: increment(pkg.amount) }))}>Purchase</PaystackButton>
                             </CardFooter>
                         </Card>
                    ))}
                 </div>
            </section>
            <section>
                 <div className="text-center mb-8"><ShieldCheck className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">Verification Badge</h2></div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {badgePlans.map(plan => (
                         <Card key={plan.duration} className="flex flex-col hover:shadow-xl transition-shadow">
                             <CardHeader><CardTitle className="text-2xl">{plan.title}</CardTitle></CardHeader>
                             <CardContent className="flex-grow space-y-4"><p className="text-4xl font-bold font-headline text-primary">₦{plan.price.toLocaleString()}</p><ul className="space-y-2 text-sm text-muted-foreground">{plan.features.map(feature => (<li key={feature} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /><span>{feature}</span></li>))}</ul></CardContent>
                             <CardFooter>
                                <PaystackButton email={user!.email!} title={`Verification Badge (${plan.title})`} price={plan.price} onSuccess={(ref) => handlePaymentSuccess(ref, `Verification Badge (${plan.title})`, plan.price, () => updateDoc(doc(db, getCollectionName(), profile!.id), { isVerified: true, badgeExpirationDate: add(new Date(), { months: plan.duration }).toISOString() }))} disabled={isDateActive(profile!.badgeExpirationDate)}>{isDateActive(profile!.badgeExpirationDate) ? 'Active' : 'Purchase'}</PaystackButton>
                             </CardFooter>
                         </Card>
                    ))}
                 </div>
            </section>
            <section>
                <div className="text-center mb-8"><Gem className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">All-in-One Packages</h2></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {vipPlans.map(plan => (
                        <Card key={plan.title} className="flex flex-col hover:shadow-2xl transition-shadow border-2 border-primary/20">
                            <CardHeader className="text-center items-center"><plan.icon className="h-10 w-10 text-primary" /><CardTitle className="text-3xl font-headline">{plan.title}</CardTitle></CardHeader>
                            <CardContent className="flex-grow space-y-4"><p className="text-5xl font-bold font-headline text-primary text-center">₦{plan.price.toLocaleString()}</p><ul className="space-y-2 text-sm text-muted-foreground pt-4">{plan.features.map(feature => (<li key={feature} className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>{feature}</span></li>))}</ul></CardContent>
                            <CardFooter>
                                <PaystackButton email={user!.email!} title={plan.title} price={plan.price} onSuccess={(ref) => handlePaymentSuccess(ref, plan.title, plan.price, () => handleVipPurchase(plan))} size="lg" disabled={profile!.tier === plan.tier}>{profile!.tier === plan.tier ? 'Current Plan' : 'Purchase Plan'}</PaystackButton> 
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>
        </>
    );

     const renderServiceSubscriptions = () => (
        <>
            <section>
                <div className="text-center mb-8"><Eye className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">Profile Visibility Plans</h2><p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Make your profile public and visible in search results so clients can find you.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {serviceProfileVisibilityPlans.map(plan => (
                        <Card key={plan.duration} className="flex flex-col text-center hover:shadow-xl transition-shadow">
                            <CardHeader><CardTitle>{plan.title}</CardTitle></CardHeader>
                            <CardContent className="flex-grow flex items-center justify-center"><p className="text-4xl font-bold font-headline text-primary">₦{plan.price.toLocaleString()}</p></CardContent>
                            <CardFooter>
                               <PaystackButton email={user!.email!} title={plan.title} price={plan.price} onSuccess={(ref) => handlePaymentSuccess(ref, plan.title, plan.price, () => updateDoc(doc(db, getCollectionName(), profile!.id), { profileVisibleUntil: add(new Date(), { months: plan.duration }).toISOString() }))} disabled={isDateActive(profile!.profileVisibleUntil)}>{isDateActive(profile!.profileVisibleUntil) ? 'Active' : 'Purchase'}</PaystackButton>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>
            <section>
                <div className="text-center mb-8"><ShieldCheck className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">Verification & Boost Plans</h2><p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Get the official verification badge and a boost in search results to attract more clients.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {serviceVerificationPlans.map(plan => (
                        <Card key={plan.duration} className="flex flex-col text-center hover:shadow-xl transition-shadow">
                            <CardHeader><CardTitle>{plan.title}</CardTitle></CardHeader>
                            <CardContent className="flex-grow flex items-center justify-center"><p className="text-4xl font-bold font-headline text-primary">₦{plan.price.toLocaleString()}</p></CardContent>
                            <CardFooter>
                                <PaystackButton email={user!.email!} title={plan.title} price={plan.price} onSuccess={(ref) => handlePaymentSuccess(ref, plan.title, plan.price, () => updateDoc(doc(db, getCollectionName(), profile!.id), { isVerified: true, badgeExpirationDate: add(new Date(), { months: plan.duration }).toISOString(), boostedUntil: add(new Date(), { months: plan.duration }).toISOString() }))} disabled={isDateActive(profile!.badgeExpirationDate)}>{isDateActive(profile!.badgeExpirationDate) ? 'Active' : 'Purchase'}</PaystackButton>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>
            <section>
                <div className="text-center mb-8"><Gem className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">All-in-One VIP Tiers</h2><p className="text-muted-foreground mt-2 max-w-2xl mx-auto">The ultimate packages for maximum visibility, credibility, and features.</p></div>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {serviceVipTiers.map(plan => (
                        <Card key={plan.title} className="flex flex-col hover:shadow-2xl transition-shadow border-2 border-primary/20">
                            <CardHeader className="text-center items-center"><plan.icon className="h-10 w-10 text-primary" /><CardTitle className="text-3xl font-headline">{plan.title}</CardTitle></CardHeader>
                            <CardContent className="flex-grow space-y-4"><p className="text-5xl font-bold font-headline text-primary text-center">₦{plan.price.toLocaleString()}</p><ul className="space-y-2 text-sm text-muted-foreground pt-4">{plan.features.map(feature => (<li key={feature} className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>{feature}</span></li>))}</ul></CardContent>
                            <CardFooter>
                               <PaystackButton email={user!.email!} title={plan.title} price={plan.price} onSuccess={(ref) => handlePaymentSuccess(ref, plan.title, plan.price, () => handleServiceVipTierPurchase(plan))} size="lg" disabled={profile!.tier === plan.tier}>{profile!.tier === plan.tier ? 'Current Plan' : 'Purchase Plan'}</PaystackButton>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>
        </>
    );

    const renderLawyerSubscriptions = () => (
        <>
            <section>
                <div className="text-center mb-8"><Eye className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">Profile Visibility Plans</h2><p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Make your profile public and visible in search results so clients can find you.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {lawyerProfilePlans.map(plan => (
                        <Card key={plan.duration} className="flex flex-col text-center hover:shadow-xl transition-shadow">
                            <CardHeader><CardTitle>{plan.title}</CardTitle></CardHeader>
                            <CardContent className="flex-grow flex items-center justify-center"><p className="text-4xl font-bold font-headline text-primary">₦{plan.price.toLocaleString()}</p></CardContent>
                            <CardFooter>
                               <PaystackButton email={user!.email!} title={plan.title} price={plan.price} onSuccess={(ref) => handlePaymentSuccess(ref, plan.title, plan.price, () => updateDoc(doc(db, getCollectionName(), profile!.id), { profileVisibleUntil: add(new Date(), { months: plan.duration }).toISOString() }))} disabled={isDateActive(profile!.profileVisibleUntil)}>{isDateActive(profile!.profileVisibleUntil) ? 'Active' : 'Purchase'}</PaystackButton>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>
            <section>
                <div className="text-center mb-8"><ShieldCheck className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">Verification & Boost Plans</h2><p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Get the official verification badge and a boost in search results to attract more clients.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {lawyerVerificationPlans.map(plan => (
                        <Card key={plan.duration} className="flex flex-col text-center hover:shadow-xl transition-shadow">
                            <CardHeader><CardTitle>{plan.title}</CardTitle></CardHeader>
                            <CardContent className="flex-grow flex items-center justify-center"><p className="text-4xl font-bold font-headline text-primary">₦{plan.price.toLocaleString()}</p></CardContent>
                            <CardFooter>
                                <PaystackButton email={user!.email!} title={plan.title} price={plan.price} onSuccess={(ref) => handlePaymentSuccess(ref, plan.title, plan.price, () => updateDoc(doc(db, getCollectionName(), profile!.id), { isVerified: true, badgeExpirationDate: add(new Date(), { months: plan.duration }).toISOString(), boostedUntil: add(new Date(), { months: plan.duration }).toISOString() }))} disabled={isDateActive(profile!.badgeExpirationDate)}>{isDateActive(profile!.badgeExpirationDate) ? 'Active' : 'Purchase'}</PaystackButton>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>
            <section>
                <div className="text-center mb-8"><Gem className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">All-in-One VIP Tiers</h2><p className="text-muted-foreground mt-2 max-w-2xl mx-auto">The ultimate packages for maximum visibility, credibility, and features.</p></div>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {lawyerVipPlans.map(plan => (
                        <Card key={plan.title} className="flex flex-col hover:shadow-2xl transition-shadow border-2 border-primary/20">
                            <CardHeader className="text-center items-center"><plan.icon className="h-10 w-10 text-primary" /><CardTitle className="text-3xl font-headline">{plan.title}</CardTitle></CardHeader>
                            <CardContent className="flex-grow space-y-4"><p className="text-5xl font-bold font-headline text-primary text-center">₦{plan.price.toLocaleString()}</p><ul className="space-y-2 text-sm text-muted-foreground pt-4">{plan.features.map(feature => (<li key={feature} className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>{feature}</span></li>))}</ul></CardContent>
                            <CardFooter>
                               <PaystackButton email={user!.email!} title={plan.title} price={plan.price} onSuccess={(ref) => handlePaymentSuccess(ref, plan.title, plan.price, () => handleLawyerVipTierPurchase(plan))} size="lg" disabled={profile!.tier === plan.tier}>{profile!.tier === plan.tier ? 'Current Plan' : 'Purchase Plan'}</PaystackButton>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>
        </>
    );

    const renderLogisticsSubscriptions = () => (
        <>
            <section>
                <div className="text-center mb-8"><Eye className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">Profile Visibility Plans</h2><p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Make your profile public and visible in search results so clients can find you.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {logisticsProfileVisibilityPlans.map(plan => (
                        <Card key={plan.duration} className="flex flex-col text-center hover:shadow-xl transition-shadow">
                            <CardHeader><CardTitle>{plan.title}</CardTitle></CardHeader>
                            <CardContent className="flex-grow flex items-center justify-center"><p className="text-4xl font-bold font-headline text-primary">₦{plan.price.toLocaleString()}</p></CardContent>
                            <CardFooter>
                               <PaystackButton email={user!.email!} title={plan.title} price={plan.price} onSuccess={(ref) => handlePaymentSuccess(ref, plan.title, plan.price, () => updateDoc(doc(db, getCollectionName(), profile!.id), { profileVisibleUntil: add(new Date(), { months: plan.duration }).toISOString() }))} disabled={isDateActive(profile!.profileVisibleUntil)}>{isDateActive(profile!.profileVisibleUntil) ? 'Active' : 'Purchase'}</PaystackButton>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>
            <section>
                <div className="text-center mb-8"><ShieldCheck className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">Verification & Boost Plans</h2><p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Get the official verification badge and a boost in search results to attract more clients.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {logisticsVerificationPlans.map(plan => (
                        <Card key={plan.duration} className="flex flex-col text-center hover:shadow-xl transition-shadow">
                            <CardHeader><CardTitle>{plan.title}</CardTitle></CardHeader>
                            <CardContent className="flex-grow flex items-center justify-center"><p className="text-4xl font-bold font-headline text-primary">₦{plan.price.toLocaleString()}</p></CardContent>
                            <CardFooter>
                                <PaystackButton email={user!.email!} title={plan.title} price={plan.price} onSuccess={(ref) => handlePaymentSuccess(ref, plan.title, plan.price, () => updateDoc(doc(db, getCollectionName(), profile!.id), { isVerified: true, badgeExpirationDate: add(new Date(), { months: plan.duration }).toISOString(), boostedUntil: add(new Date(), { months: plan.duration }).toISOString() }))} disabled={isDateActive(profile!.badgeExpirationDate)}>{isDateActive(profile!.badgeExpirationDate) ? 'Active' : 'Purchase'}</PaystackButton>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>
            <section>
                <div className="text-center mb-8"><Gem className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">All-in-One VIP Tiers</h2><p className="text-muted-foreground mt-2 max-w-2xl mx-auto">The ultimate packages for maximum visibility, credibility, and features.</p></div>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {logisticsVipTiers.map(plan => (
                        <Card key={plan.title} className="flex flex-col hover:shadow-2xl transition-shadow border-2 border-primary/20">
                            <CardHeader className="text-center items-center"><plan.icon className="h-10 w-10 text-primary" /><CardTitle className="text-3xl font-headline">{plan.title}</CardTitle></CardHeader>
                            <CardContent className="flex-grow space-y-4"><p className="text-5xl font-bold font-headline text-primary text-center">₦{plan.price.toLocaleString()}</p><ul className="space-y-2 text-sm text-muted-foreground pt-4">{plan.features.map(feature => (<li key={feature} className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>{feature}</span></li>))}</ul></CardContent>
                            <CardFooter>
                               <PaystackButton email={user!.email!} title={plan.title} price={plan.price} onSuccess={(ref) => handlePaymentSuccess(ref, plan.title, plan.price, () => handleLogisticsVipTierPurchase(plan))} size="lg" disabled={profile!.tier === plan.tier}>{profile!.tier === plan.tier ? 'Current Plan' : 'Purchase Plan'}</PaystackButton>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>
        </>
    );

    const renderCurrencyExchangeSubscriptions = () => (
        <section>
            <div className="text-center mb-8"><Gem className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">{currencyExchangeVvipPlan.title}</h2><p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{currencyExchangeVvipPlan.description}</p></div>
             <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 max-w-2xl mx-auto">
                <Card key={currencyExchangeVvipPlan.title} className="flex flex-col hover:shadow-2xl transition-shadow border-2 border-primary/20">
                    <CardHeader className="text-center items-center"><currencyExchangeVvipPlan.icon className="h-10 w-10 text-primary" /><CardTitle className="text-3xl font-headline">{currencyExchangeVvipPlan.title}</CardTitle></CardHeader>
                    <CardContent className="flex-grow space-y-4"><p className="text-5xl font-bold font-headline text-primary text-center">₦{currencyExchangeVvipPlan.price.toLocaleString()}</p><ul className="space-y-2 text-sm text-muted-foreground pt-4">{currencyExchangeVvipPlan.features.map(feature => (<li key={feature} className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>{feature}</span></li>))}</ul></CardContent>
                    <CardFooter>
                        <PaystackButton email={user!.email!} title={currencyExchangeVvipPlan.title} price={currencyExchangeVvipPlan.price} onSuccess={(ref) => handlePaymentSuccess(ref, currencyExchangeVvipPlan.title, currencyExchangeVvipPlan.price, () => handleCurrencyExchangeVipPurchase(currencyExchangeVvipPlan))} size="lg" disabled={profile!.tier === currencyExchangeVvipPlan.tier}>{profile!.tier === currencyExchangeVvipPlan.tier ? 'Current Plan' : 'Purchase Plan'}</PaystackButton>
                    </CardFooter>
                </Card>
            </div>
        </section>
    );

    const renderSubscriptions = () => {
        if (!profile || !providerType) return <p>Could not load subscription details.</p>;

        switch(providerType) {
            case 'vendor': return renderVendorSubscriptions();
            case 'lawyer': return renderLawyerSubscriptions();
            case 'logistics': return renderLogisticsSubscriptions();
            case 'service': return renderServiceSubscriptions();
            case 'currency-exchange': return renderCurrencyExchangeSubscriptions();
            default: return <p>No subscriptions available for your provider type.</p>;
        }
    }

    if (authLoading || loadingData) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-4">Loading Subscriptions...</p></div>;
    }


    return (
        <div className="space-y-16">
            <header className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground">Grow Your Business</h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">Upgrade your account with our powerful subscription plans.</p>
            </header>
            
            {renderSubscriptions()}

            <section>
                <div className="text-center mb-8"><Receipt className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">Transaction History</h2></div>
                <Card className="shadow-xl">
                    <CardContent className="pt-6">
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {transactions.length > 0 ? (
                                        transactions.map(tx => (<TableRow key={tx.id}><TableCell>{formatTimestamp(tx.timestamp)}</TableCell><TableCell className="font-medium">{tx.description}</TableCell></TableRow>))
                                    ) : ( <TableRow><TableCell colSpan={2} className="h-24 text-center">You have no transaction history yet.</TableCell></TableRow> )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
