
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Vendor, Transaction, ServiceProvider, Lawyer, CurrencyExchangeAgent, LogisticsCompany } from '@/lib/data';
import { createTransaction, fetchProviderDataByUid } from '@/lib/data';
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
import type { PaystackProps } from 'react-paystack/dist/types';

type ProviderData = Vendor | ServiceProvider | Lawyer | CurrencyExchangeAgent | LogisticsCompany;
type ProviderType = 'service' | 'lawyer' | 'currency-exchange' | 'logistics' | 'vendor' | null;

// --- VENDOR PLANS ---
const vipPlans = [
    { title: 'VIP Package', price: 100000, icon: Crown, features: ['30 Post Package Included', 'Official Verification Badge', 'Exclusive VIP Profile Badge', '1-Month Boost for 10 Products'], tier: 'vip' as const },
    { title: 'VVIP Package', price: 150000, icon: Gem, features: ['Unlimited Product Posts', 'Official Verification Badge', 'Exclusive VVIP Profile Badge', '2-Month Boost on All New Posts'], tier: 'vvip' as const }
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
    { amount: -1, price: 50000, title: 'Unlimited Posts', description: 'The ultimate freedom to sell.' },
];
const adPlans = [
    { boosts: 5, duration: '1 Week', price: 3000, description: 'Feature your products at the top of search results for a full week.' },
    { boosts: 12, duration: '2 Weeks', price: 5000, description: 'Maximize visibility with a two-week boosted placement.' },
    { boosts: 30, duration: '1 Month', price: 10000, description: 'Dominate the marketplace with a full month of top ad placement.' },
];

// --- OTHER PROVIDER PLANS ---
const currencyExchangeVvipPlan = { tier: 'vvip' as const, price: 150000, title: 'VVIP Annual Subscription', description: 'Unlock your profile and gain maximum visibility and trust on the platform with our all-inclusive annual VVIP package.', features: ['1-Year Profile Visibility', 'Exclusive VVIP Badge', 'Official Verification Badge'], icon: Gem, duration: 12 };
const logisticsFlightAndTrainPlans = [ { duration: 1, price: 10000, title: '1 Month Profile Visibility' }, { duration: 6, price: 50000, title: '6 Months Profile Visibility' }, { duration: 12, price: 100000, title: '1 Year Profile Visibility' }];
const logisticsCarPlans = [ { duration: 1, price: 8000, title: '1 Month Profile Visibility' }, { duration: 6, price: 30000, title: '6 Months Profile Visibility' }, { duration: 12, price: 80000, title: '1 Year Profile Visibility' }];
const logisticsDispatchPlans = [ { duration: 1, price: 5000, title: '1 Month Profile Visibility' }, { duration: 6, price: 25000, title: '6 Months Profile Visibility' }, { duration: 12, price: 50000, title: '1 Year Profile Visibility' }];
const logisticsVerificationPlans = [ { duration: 1, price: 3000, title: '1 Month Verification' }, { duration: 6, price: 15000, title: '6 Months Verification' }, { duration: 12, price: 30000, title: '1 Year Verification' }];
const logisticsVipPlans = [ { tier: 'vip' as const, duration: 6, price: 80000, title: 'VIP Package (6 Months)', features: ['6 Months Profile Visibility', '6 Months Verification Badge', 'Boosted Profile Placement'] }, { tier: 'vvip' as const, duration: 12, price: 150000, title: 'VVIP Package (1 Year)', features: ['1 Year Profile Visibility', '1 Year Verification Badge', 'Top Priority Profile Placement', 'Recommended to local users'] }];
const lawyerProfilePlans = [ { duration: 1, price: 10000, title: '1 Month Profile Visibility' }, { duration: 6, price: 50000, title: '6 Months Profile Visibility' }, { duration: 12, price: 100000, title: '1 Year Profile Visibility' }];
const lawyerVerificationPlans = [ { duration: 1, price: 3000, title: '1 Month Verification' }, { duration: 6, price: 15000, title: '6 Months Verification' }, { duration: 12, price: 30000, title: '1 Year Verification' }];
const lawyerVipPlans = [ { tier: 'vip' as const, duration: 6, price: 60000, title: 'VIP Package (6 Months)', features: ['6 Months Profile Visibility', '6 Months Verification Badge', 'VIP Profile Badge'] }, { tier: 'vvip' as const, duration: 12, price: 150000, title: 'VVIP Package (1 Year)', features: ['1 Year Profile Visibility', '1 Year Verification Badge', 'VVIP Profile Badge', 'Top Profile Placement', 'Auto-recommendation for relevant transactions'] }];
const serviceVipPlans = [ { tier: 'vip' as const, duration: 6, price: 50000, title: 'VIP Package', features: ['6 Months Profile Visibility', '6 Months Verification Badge', 'Standard Profile Boost', 'Up to 3 Gallery Photos'] }, { tier: 'vvip' as const, duration: 12, price: 90000, title: 'VVIP Package', features: ['1 Year Profile Visibility', '1 Year Verification Badge', 'High-Priority Profile Boost', 'Up to 6 Gallery Photos', 'Top Profile Placement'] }];

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
    const [providerType, setProviderType] = useState<ProviderType>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const refreshData = useCallback(async (uid: string) => {
        const { providerData, type, transactions: providerTransactions } = await fetchProviderDataByUid(uid);
        setProfile(providerData);
        setProviderType(type as ProviderType);
        if(providerTransactions) setTransactions(providerTransactions);
    }, []);

    useEffect(() => {
      if (!authLoading) {
        if (!user) {
          router.push('/login');
          return;
        }
        fetchProviderDataByUid(user.uid).then(({ providerData, type, transactions }) => {
            if (providerData && type) {
                setProfile(providerData);
                setProviderType(type as ProviderType);
                if (transactions) setTransactions(transactions);
            } else {
                toast({ variant: 'destructive', title: 'Not a Provider', description: "This page is for registered providers only." });
                router.push('/profile');
            }
            setLoadingData(false);
        });
      }
    }, [user, authLoading, router, toast]);

    const handlePaymentSuccess = async (reference: string, description: string, action: () => Promise<void>) => {
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
            await createTransaction(profile.id, description, 0, providerType);
            await refreshData(user.uid);
            toast({ title: 'Account Updated!', description: `Your purchase of "${description}" is complete.` });

        } catch (error: any) {
            console.error("Error processing purchase:", error);
            toast({ variant: 'destructive', title: 'Error Processing Purchase', description: error.message || 'There was a problem updating your account.' });
        }
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
                <div className="text-center mb-8"><Gem className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">All-in-One Packages</h2></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {vipPlans.map(plan => (
                        <Card key={plan.title} className="flex flex-col hover:shadow-2xl transition-shadow border-2 border-primary/20">
                            <CardHeader className="text-center items-center"><plan.icon className="h-10 w-10 text-primary" /><CardTitle className="text-3xl font-headline">{plan.title}</CardTitle></CardHeader>
                            <CardContent className="flex-grow space-y-4"><p className="text-5xl font-bold font-headline text-primary text-center">₦{plan.price.toLocaleString()}</p><ul className="space-y-2 text-sm text-muted-foreground pt-4">{plan.features.map(feature => (<li key={feature} className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>{feature}</span></li>))}</ul></CardContent>
                            <CardFooter>
                                <PaystackButton email={user!.email!} title={plan.title} price={plan.price} onSuccess={(ref) => handlePaymentSuccess(ref, plan.title, () => updateDoc(doc(db, getCollectionName(), profile!.id), { tier: plan.tier, isVerified: true, badgeExpirationDate: add(new Date(), { months: 12 }).toISOString(), postLimit: plan.tier === 'vvip' ? -1 : increment(30) }))} size="lg" disabled={profile!.tier === plan.tier}>{profile!.tier === plan.tier ? 'Purchased' : 'Purchase'}</PaystackButton> 
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
                                <PaystackButton email={user!.email!} title={`Verification Badge (${plan.title})`} price={plan.price} onSuccess={(ref) => handlePaymentSuccess(ref, `Verification Badge (${plan.title})`, () => updateDoc(doc(db, getCollectionName(), profile!.id), { isVerified: true, badgeExpirationDate: add(new Date(), { months: plan.duration }).toISOString() }))} disabled={isDateActive(profile!.badgeExpirationDate)}>{isDateActive(profile!.badgeExpirationDate) ? 'Active' : 'Purchase'}</PaystackButton>
                             </CardFooter>
                         </Card>
                    ))}
                 </div>
            </section>
             <section>
                 <div className="text-center mb-8"><PlusCircle className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">Post Packages</h2></div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {postPackages.map(pkg => (
                         <Card key={pkg.title} className="flex flex-col text-center hover:shadow-xl transition-shadow">
                             <CardHeader><CardTitle className="text-2xl">{pkg.title}</CardTitle><CardDescription>{pkg.description}</CardDescription></CardHeader>
                             <CardContent className="flex-grow flex items-center justify-center"><p className="text-4xl font-bold font-headline text-primary">₦{pkg.price.toLocaleString()}</p></CardContent>
                             <CardFooter>
                                <PaystackButton email={user!.email!} title={`Post Package (${pkg.title})`} price={pkg.price} onSuccess={(ref) => handlePaymentSuccess(ref, `Post Package (${pkg.title})`, () => updateDoc(doc(db, getCollectionName(), profile!.id), { postLimit: pkg.amount === -1 ? -1 : increment(pkg.amount) }))}>Purchase</PaystackButton>
                             </CardFooter>
                         </Card>
                    ))}
                 </div>
            </section>
        </>
    );

    const renderOtherProviderSubscriptions = (title: string, plans: any[]) => (
         <section>
            <div className="text-center mb-8"><Eye className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-3xl font-bold font-headline">{title}</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan: any) => (
                    <Card key={plan.title} className="flex flex-col text-center hover:shadow-xl transition-shadow"><CardHeader><CardTitle>{plan.title}</CardTitle></CardHeader><CardContent className="flex-grow flex items-center justify-center"><p className="text-4xl font-bold font-headline text-primary">₦{plan.price.toLocaleString()}</p></CardContent>
                    <CardFooter>
                        <PaystackButton email={user!.email!} title={plan.title} price={plan.price} onSuccess={(ref) => handlePaymentSuccess(ref, plan.title, () => updateDoc(doc(db, getCollectionName(), profile!.id), { profileVisibleUntil: add(new Date(), { months: plan.duration }).toISOString() }))} disabled={isDateActive(profile!.profileVisibleUntil)}>{isDateActive(profile!.profileVisibleUntil) ? 'Active' : 'Purchase'}</PaystackButton>
                    </CardFooter></Card>
                ))}
            </div>
        </section>
    );

    const renderSubscriptions = () => {
        if (!profile || !providerType) return <p>Could not load subscription details.</p>;

        switch(providerType) {
            case 'vendor': return renderVendorSubscriptions();
            case 'lawyer': return renderOtherProviderSubscriptions('Lawyer Plans', lawyerProfilePlans);
            case 'logistics':
                const logisticsProvider = profile as LogisticsCompany;
                let plans = logisticsDispatchPlans;
                if (['International Flight', 'Local Flight', 'Train Logistics'].includes(logisticsProvider.category)) plans = logisticsFlightAndTrainPlans;
                if (logisticsProvider.category === 'Car Logistics') plans = logisticsCarPlans;
                return renderOtherProviderSubscriptions(`Logistics Plans for ${logisticsProvider.category}`, plans);
            case 'service': return renderOtherProviderSubscriptions('Service Provider Plans', serviceVipPlans.map(p => ({...p, description:''})));
            case 'currency-exchange': return renderOtherProviderSubscriptions('Currency Exchange Plans', [currencyExchangeVvipPlan]);
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
