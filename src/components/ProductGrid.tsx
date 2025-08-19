
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Product, Vendor } from '@/lib/data';
import { createTransaction, createNotification } from '@/lib/data';
import { Star, Building, MoreVertical, Edit, Trash2, EyeOff, Eye, Heart, TrendingUp, Zap, Crown, Gem, BadgeCheck, MapPin, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { usePaystackPayment } from 'react-paystack';
import { add } from 'date-fns';
import { doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ViewMode } from './ViewToggle';


interface ProductGridProps {
    products: Product[];
    vendors?: Vendor[];
    showAdminControls?: boolean;
    isVendorOwnerView?: boolean;
    viewMode?: ViewMode;
    onEdit?: (product: Product) => void;
    onToggleStatus?: (product: Product) => void;
    onDelete?: (productId: string) => void;
}

const dispatchStorageEvent = () => {
    window.dispatchEvent(new Event("storage"));
};

const boostPlans = [
    { duration: 'week', days: 7, price: 3000, label: 'Boost for 1 Week' },
    { duration: '2-weeks', days: 14, price: 5000, label: 'Boost for 2 Weeks' },
    { duration: 'month', days: 30, price: 10000, label: 'Boost for 1 Month' },
];

export function ProductGrid({ products: initialProducts, vendors, showAdminControls = false, isVendorOwnerView = false, viewMode = 'grid', onEdit, onToggleStatus, onDelete }: ProductGridProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);
  
  useEffect(() => {
    if (vendors && vendors.length > 0) {
      setLoadingVendors(false);
    }
  }, [vendors]);
  
  const getVendor = (vendorId: string) => {
    return vendors?.find(v => v.id === vendorId);
  }

  const isBadgeActive = (v?: Vendor) => {
    if (!v || !v.isVerified || !v.badgeExpirationDate) return false;
    return new Date(v.badgeExpirationDate) > new Date();
  };

  const handleAddToFavorites = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Please log in',
            description: 'You need to be logged in to add products to your favorites.',
        });
        router.push('/login');
        return;
    }

    if (isVendorOwnerView) {
        toast({
            title: "Action Not Allowed",
            description: "You cannot favorite your own products.",
        });
        return;
    }
    
    const currentFavorites: Product[] = JSON.parse(localStorage.getItem('user-favorites') || '[]');
    
    if (currentFavorites.some(p => p.id === product.id)) {
        toast({ title: "Already in Favorites" });
        return;
    }
    
    const newFavorites = [...currentFavorites, product];
    localStorage.setItem('user-favorites', JSON.stringify(newFavorites));
    dispatchStorageEvent();
    
    // Increment favorite count on the product
    const productRef = doc(db, 'products', product.id);
    await updateDoc(productRef, { favoriteCount: increment(1) });
    
    toast({
        title: "Added to Favorites!",
        description: `${product.name} has been saved.`,
    });
  };

  const handleBoostPaymentSuccess = async (product: Product, plan: typeof boostPlans[0]) => {
    const boostExpirationDate = add(new Date(), { days: plan.days }).toISOString();
    const productRef = doc(db, 'products', product.id);
    const vendor = getVendor(product.vendorId);

    try {
        await updateDoc(productRef, { boostedUntil: boostExpirationDate });
        
        await createTransaction(
            product.vendorId,
            `Product Boost: ${product.name} (${plan.label})`,
            plan.price,
            'vendor'
        );
        
        if (vendor?.uid) {
            await createNotification({
                recipientId: vendor.uid,
                senderId: 'system',
                senderName: 'EliteHub',
                type: 'product_boosted',
                productId: product.id,
                productName: product.name,
                text: `Your product "${product.name}" has been boosted for ${plan.days} days!`,
                isRead: false,
                timestamp: serverTimestamp(),
            });
        }
        
        // Update local state to reflect the change immediately
        setProducts(currentProducts =>
            currentProducts.map(p =>
                p.id === product.id ? { ...p, boostedUntil: boostExpirationDate } : p
            )
        );
        toast({
            title: 'Boost Activated!',
            description: `${product.name} is now boosted for ${plan.days} days.`,
        });
    } catch (error) {
        console.error("Failed to update product boost status:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to activate boost. Please contact support.',
        });
    }
  };

  const BoostPaymentButton = ({ product, plan }: { product: Product, plan: typeof boostPlans[0] }) => {
    const initializePayment = usePaystackPayment({
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
      currency: 'NGN',
      email: user!.email!,
      amount: plan.price * 100, // Amount is in kobo
      reference: (new Date()).getTime().toString(),
    });

    const initiateBoostPayment = () => {
        if (!user?.email) {
            toast({ variant: 'destructive', title: 'Error', description: 'User email not found.' });
            return;
        }
        initializePayment({
          onSuccess: () => handleBoostPaymentSuccess(product, plan),
          onClose: () => {
            toast({
              variant: 'destructive',
              title: 'Payment Cancelled',
              description: 'The boost payment process was cancelled.',
            });
          },
        });
    };

    return (
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={initiateBoostPayment}>
            <span>{plan.label} - ₦{plan.price.toLocaleString()}</span>
        </DropdownMenuItem>
    );
  }
  
  const isProductBoosted = (product: Product) => {
      return !!(product.boostedUntil && new Date(product.boostedUntil) > new Date());
  }


  return (
    <div>
      {products.length > 0 ? (
        <div className={cn(
          "gap-3 sm:gap-6",
          viewMode === 'grid' 
            ? (isVendorOwnerView 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                : "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4") 
            : "space-y-4"
        )}>
          {products.map((product) => {
            const vendor = getVendor(product.vendorId);
            if (viewMode === 'list') {
              return (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-2 sm:p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href={`/products/${product.id}`}>
                                <Image src={product.images[0]} alt={product.name} width={80} height={80} className="rounded-md object-cover" data-ai-hint={product.dataAiHint}/>
                            </Link>
                            <div className="text-sm">
                                <Link href={`/products/${product.id}`} className="font-bold hover:underline">{product.name}</Link>
                                <p className="text-xs text-muted-foreground">{product.category}</p>
                                {vendor && (
                                     <Link href={`/vendors/${vendor.id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 mt-1">
                                        <Building className="h-3 w-3" />
                                        <span>{vendor.name}</span>
                                        {isBadgeActive(vendor) && <BadgeCheck className="h-3 w-3 text-green-500" />}
                                        {vendor.tier === 'vip' && <Crown className="h-3 w-3 text-yellow-500"/>}
                                        {vendor.tier === 'vvip' && <Gem className="h-3 w-3 text-purple-500"/>}
                                    </Link>
                                )}
                                <p className="text-base font-semibold text-primary mt-1">₦{product.price?.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <Button asChild size="sm">
                                <Link href={`/products/${product.id}`}>View</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
              )
            }
            return (
            <Card key={product.id} className={cn(
                "overflow-hidden flex flex-col group transform hover:-translate-y-1 transition-transform duration-300 shadow-lg hover:shadow-xl rounded-xl",
                product.status === 'closed' && 'bg-muted/50',
                isVendorOwnerView && 'sm:col-span-1'
            )}>
              <CardContent className="p-0 flex-grow flex flex-col">
                <div className="relative aspect-square bg-muted/30">
                  <Link href={`/products/${product.id}`} className="block h-full">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={600}
                      height={400}
                      className={cn("object-contain w-full h-full", product.status === 'closed' && "grayscale")}
                      data-ai-hint={product.dataAiHint}
                    />
                  </Link>
                  <div className="absolute top-2 left-2 space-y-1">
                    {product.condition && (
                        <Badge className={cn(product.condition === 'new' ? "bg-blue-600" : "bg-orange-600", "text-white")} variant="secondary">
                           <Tag className="mr-1 h-3 w-3" /> {product.condition === 'new' ? 'Brand New' : 'Used'}
                        </Badge>
                    )}
                    {isProductBoosted(product) && (
                        <Badge className="bg-purple-600 text-white" variant="secondary">
                            <Zap className="mr-1 h-3 w-3" /> Boosted
                        </Badge>
                    )}
                    {isVendorOwnerView && product.status === 'active' && (
                         <Badge variant="default" className="bg-green-600 text-white">
                            <Eye className="mr-1 h-3 w-3" /> Active
                        </Badge>
                    )}
                    {vendor?.tier === 'vip' && (
                        <Badge className="bg-yellow-500 text-white" variant="secondary">
                            <Crown className="mr-1 h-3 w-3" /> VIP
                        </Badge>
                    )}
                    {vendor?.tier === 'vvip' && (
                        <Badge className="bg-purple-600 text-white" variant="secondary">
                            <Gem className="mr-1 h-3 w-3" /> VVIP
                        </Badge>
                    )}
                  </div>
                   {product.category === 'Property' && (
                        <div className="absolute bottom-2 left-2 right-2">
                             <Badge className="bg-black/60 text-white backdrop-blur-sm" variant="secondary">
                                <MapPin className="mr-1 h-3 w-3" /> {product.location}
                            </Badge>
                        </div>
                    )}
                  {showAdminControls && (
                    <div className="absolute top-2 right-2">
                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit?.(product)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onToggleStatus?.(product)}>
                              {product.status === 'active' ? (
                                <EyeOff className="mr-2 h-4 w-4" />
                              ) : (
                                <Eye className="mr-2 h-4 w-4" />
                              )}
                              <span>{product.status === 'active' ? 'Close' : 'Reopen'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this product
                              and remove its data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete?.(product.id)}>
                              Yes, delete product
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
                <div className="p-3 md:p-4 flex flex-col flex-grow">
                  <div className="flex-grow">
                      <Link href={`/products/${product.id}`} className="hover:text-primary">
                        <h3 className="text-sm sm:text-base font-semibold font-headline text-foreground truncate">{product.name}</h3>
                      </Link>
                      <div className="text-xs text-muted-foreground mt-1">
                        {loadingVendors ? (
                          <Skeleton className="h-4 w-24" />
                        ) : (
                          <Link href={`/vendors/${product.vendorId}`} className="hover:text-primary transition-colors flex items-center gap-1.5">
                            <Building className="h-3 w-3" />
                            {vendor?.name || 'Vendor'}
                            {isBadgeActive(vendor) && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <BadgeCheck className="h-4 w-4 text-green-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Verified Vendor</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                            )}
                          </Link>
                        )}
                      </div>
                      
                      {vendor && (
                        <div className="flex items-center mt-2 text-xs text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1.5" />
                            <span>{vendor.city}, {vendor.location}</span>
                        </div>
                      )}
                      
                      {isVendorOwnerView && (
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                            <div className="flex items-center">
                                <Eye className="h-4 w-4 mr-1.5" />
                                <span>{product.viewCount || 0} views</span>
                            </div>
                            <div className="flex items-center">
                                <Heart className="h-4 w-4 mr-1.5" />
                                <span>{product.favoriteCount || 0} favorites</span>
                            </div>
                        </div>
                      )}
                  </div>
                  <div className="flex justify-between items-end pt-2 mt-2">
                    <p className="text-lg sm:text-xl font-bold text-primary">₦{product.price?.toLocaleString()}</p>
                    {!isVendorOwnerView && (
                      <Button size="icon" variant="ghost" className="rounded-full h-8 w-8" onClick={(e) => handleAddToFavorites(e, product)}>
                          <Heart className="h-4 w-4 text-muted-foreground"/>
                          <span className="sr-only">Favorite</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
               {isVendorOwnerView && (
                  <CardFooter className="p-2 sm:p-4 mt-auto">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" className="w-full" disabled={!!(product.status === 'closed' || isProductBoosted(product))}>
                              <TrendingUp className="mr-2 h-4 w-4"/>
                              {isProductBoosted(product) ? 'Boosted' : 'Boost'}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Boost Options</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {boostPlans.map(plan => (
                              <BoostPaymentButton key={plan.duration} product={product} plan={plan} />
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </CardFooter>
               )}
            </Card>
          )})}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-xl text-muted-foreground">No products found.</p>
        </div>
      )}
    </div>
  );
}
