
'use client';

import Image from 'next/image';
import { type Product, type Vendor, createNotification } from '@/lib/data';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ProductGrid } from '@/components/ProductGrid';
import {
  Star,
  BadgeCheck,
  Building,
  Mail,
  MapPin,
  User,
  Crown,
  Gem,
  Phone,
  Home,
  FileCheck2,
  MessageSquare,
  Share2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, increment, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PublicVendorProfileProps {
  vendor: Vendor;
  products: Product[];
}

const VIEW_MILESTONES = [50, 100, 250, 500, 1000, 5000, 10000];

export function PublicVendorProfile({ vendor, products }: PublicVendorProfileProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [localVendor, setLocalVendor] = useState<Vendor>(vendor);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const isOwner = user && vendor.uid && user.uid === vendor.uid;

   useEffect(() => {
    const trackViewAndNotify = async () => {
        const viewedKey = `viewed-vendor-${vendor.id}`;
        if (!sessionStorage.getItem(viewedKey)) {
            const vendorRef = doc(db, 'vendors', vendor.id);
            const vendorDoc = await getDoc(vendorRef);

            if (vendorDoc.exists()) {
                const currentVendorData = vendorDoc.data() as Vendor;
                const newViewCount = (currentVendorData.profileViews || 0) + 1;
                
                const updates: Partial<Vendor> = { profileViews: newViewCount };

                // Check for milestones
                const lastNotifiedMilestone = Math.max(0, ...(currentVendorData.notifiedViewMilestones || []));
                const nextMilestone = VIEW_MILESTONES.find(m => m > lastNotifiedMilestone);

                if (nextMilestone && newViewCount >= nextMilestone) {
                    updates.notifiedViewMilestones = [...(currentVendorData.notifiedViewMilestones || []), nextMilestone];
                    
                    if(vendor.uid) {
                        await createNotification({
                            recipientId: vendor.uid,
                            senderId: 'system',
                            senderName: 'EliteHub Analytics',
                            type: 'profile_view_milestone',
                            text: `Congratulations! Your profile has reached ${newViewCount} views. Keep up the great work!`,
                            isRead: false,
                            timestamp: serverTimestamp(),
                        });
                    }
                }
                
                await updateDoc(vendorRef, updates);
                sessionStorage.setItem(viewedKey, 'true');
            }
        }
    };
    
    if (user && !isOwner) {
      trackViewAndNotify();
    }


    const ratedVendors = JSON.parse(localStorage.getItem('rated-vendors') || '{}');
    if (user && ratedVendors[user.uid]?.includes(vendor.id)) {
        setHasRated(true);
    }

  }, [vendor.id, vendor.uid, user, isOwner]);

  const handleRatingSubmit = async (newRating: number) => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Please log in',
            description: 'You must be logged in to rate a vendor.',
        });
        router.push('/login');
        return;
    }

    if (hasRated) {
        toast({
            title: 'Already Rated',
            description: 'You have already submitted a rating for this vendor.',
        });
        return;
    }

    const vendorRef = doc(db, 'vendors', vendor.id);

    try {
        await runTransaction(db, async (transaction) => {
            const vendorDoc = await transaction.get(vendorRef);
            if (!vendorDoc.exists()) {
                throw "Vendor does not exist!";
            }

            const currentData = vendorDoc.data() as Vendor;
            const newRatingCount = (currentData.ratingCount || 0) + 1;
            const newTotalRating = (currentData.totalRating || 0) + newRating;
            const newAverageRating = newTotalRating / newRatingCount;

            transaction.update(vendorRef, {
                ratingCount: newRatingCount,
                totalRating: newTotalRating,
                rating: newAverageRating,
            });

            // Update local state to reflect new rating immediately
            setLocalVendor(prev => ({
                ...prev,
                rating: newAverageRating,
                ratingCount: newRatingCount
            }));
        });
        
        // Mark as rated in localStorage
        const ratedVendors = JSON.parse(localStorage.getItem('rated-vendors') || '{}');
        if (!ratedVendors[user.uid]) {
            ratedVendors[user.uid] = [];
        }
        ratedVendors[user.uid].push(vendor.id);
        localStorage.setItem('rated-vendors', JSON.stringify(ratedVendors));
        setHasRated(true);

        toast({
            title: 'Rating Submitted!',
            description: `You rated ${vendor.name} ${newRating} stars.`,
        });

    } catch (error) {
        console.error("Error submitting rating: ", error);
        toast({
            variant: 'destructive',
            title: 'Rating Failed',
            description: 'There was an error submitting your rating.',
        });
    }
  };

   const isBadgeActive = (v: Vendor) => {
    if (!v.isVerified || !v.badgeExpirationDate) return false;
    return new Date(v.badgeExpirationDate) > new Date();
  };

  const getWhatsAppLink = () => {
    if (!localVendor?.whatsappNumber) return '';
    let number = localVendor.whatsappNumber.replace(/\+/g, '').replace(/\s/g, '');
    if (number.startsWith('0')) {
      number = '234' + number.substring(1);
    }
    return `https://wa.me/${number}`;
  };

   const handleShare = async () => {
    const shareData = {
        title: `View ${localVendor.name} on EliteHub`,
        text: `Check out ${localVendor.name}, a trusted vendor on EliteHub.`,
        url: `https://www.elitehubng.com/vendors/${localVendor.id}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link Copied!",
          description: "Vendor profile URL has been copied to your clipboard.",
        });
      }
    } catch (err: any) {
        if (err.name !== 'AbortError') {
          await navigator.clipboard.writeText(shareData.url);
          toast({ title: "Link Copied!", description: "Sharing was not available, so the link was copied instead." });
        }
    }
  };


  return (
    <div className="space-y-8">
      {/* Banner and Profile Header */}
      <Card className="overflow-hidden shadow-lg">
        <div className="p-6 md:p-8 bg-card relative">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Image
              src={localVendor.profileImage}
              alt={`${localVendor.name} logo`}
              width={160}
              height={160}
              className="rounded-full border-4 border-card bg-card shadow-lg"
              data-ai-hint={localVendor.dataAiHint}
            />
            <div className="text-center md:text-left mt-4 md:mt-0">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline">{localVendor.name}</h1>
                 {isBadgeActive(localVendor) && (
                  <BadgeCheck className="h-8 w-8 text-green-500" />
                )}
                 {localVendor.tier === 'vip' && (
                    <Crown className="h-8 w-8 text-yellow-500" />
                )}
                {localVendor.tier === 'vvip' && (
                    <Gem className="h-8 w-8 text-purple-500" />
                )}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3">
                 <div
                    className="flex items-center justify-center md:justify-start gap-1 text-yellow-500 mt-2"
                    onMouseLeave={() => setHoverRating(0)}
                    title={hasRated ? "You have already rated this vendor" : "Click to rate"}
                 >
                    {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={cn(
                            'h-6 w-6',
                            !hasRated && 'cursor-pointer transition-transform hover:scale-125',
                            (hoverRating || Math.round(localVendor.rating)) > i ? 'fill-current' : 'text-gray-300'
                        )}
                        onMouseEnter={() => !hasRated && setHoverRating(i + 1)}
                        onClick={() => handleRatingSubmit(i + 1)}
                    />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">
                        ({localVendor.rating.toFixed(1)} from {localVendor.ratingCount || 0} ratings)
                    </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>About this Vendor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <p className="text-muted-foreground">{localVendor.businessDescription}</p>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 pt-4 border-t">
                 <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                    <p className="font-semibold">Full Name</p>
                    <p className="text-muted-foreground">{localVendor.fullname}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-3">
                    <Home className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                    <p className="font-semibold">Address</p>
                    <p className="text-muted-foreground">{localVendor.address}, {localVendor.city}, {localVendor.location}</p>
                    </div>
                </div>
                {localVendor.rcNumber && (
                    <div className="flex items-start gap-3">
                        <FileCheck2 className="h-5 w-5 text-muted-foreground mt-1" />
                        <div>
                            <p className="font-semibold">RC Number</p>
                            <p className="text-muted-foreground">{localVendor.rcNumber}</p>
                        </div>
                    </div>
                )}
                 <div className="flex items-start gap-3">
                    {isBadgeActive(localVendor) && (
                        <>
                            <BadgeCheck className="h-5 w-5 text-green-500 mt-1" />
                            <div>
                                <p className="font-semibold">Verified Vendor</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <Button asChild>
                    <a href={`tel:${localVendor.phoneNumber}`}>
                        <Phone className="mr-2 h-4 w-4" /> Call Now
                    </a>
                </Button>
                <a href={`mailto:${localVendor.email}`}>
                    <Button variant="secondary" className="w-full">
                        <Mail className="mr-2 h-4 w-4" /> Email Vendor
                    </Button>
                </a>
                {localVendor.whatsappNumber ? (
                    <Button asChild className="bg-green-600 hover:bg-green-700">
                         <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                            <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
                        </a>
                    </Button>
                ) : (
                   <div /> 
                )}
                 <Button variant="outline" onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Profile
                </Button>
            </div>

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products from {localVendor.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length > 0 ? (
            <ProductGrid products={products} vendors={[vendor]} />
          ) : (
            <p className="text-muted-foreground">
              This vendor has not listed any products yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
