
'use client';
import { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { type Product, type Vendor } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Star, Heart, Tag, Layers, Building, MessageSquare, Loader2, Palette, XCircle, Truck, Crown, Gem, BadgeCheck, MapPin, Hash, Car, Gauge, GitCommitHorizontal, Droplets, Calendar, Scale, Cpu, MemoryStick, HardDrive, RectangleHorizontal, BatteryFull, Radio, Tv, Speaker, Bluetooth, Weight, Gamepad2, CookingPot, Zap as PowerIcon, Waves, PersonStanding, Atom, Info, Anchor, Leaf, Phone, Mail, Share2 } from 'lucide-react';
import { ProductGrid } from '@/components/ProductGrid';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Reviews } from '@/components/Reviews';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { SafetyTips } from '@/components/SafetyTips';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ProductClientPageProps {
  initialProduct: Product;
  initialVendor: Vendor | null;
  initialRelatedProducts: Product[];
}

const dispatchStorageEvent = () => {
    window.dispatchEvent(new Event("storage"));
};

export function ProductClientPage({ initialProduct, initialVendor, initialRelatedProducts }: ProductClientPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [vendor, setVendor] = useState<Vendor | null>(initialVendor);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>(initialRelatedProducts);
  const [loading, setLoading] = useState(false); // Only for client-side actions
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [currentSlide, setCurrentSlide] = useState(0)

  const isOwner = user && vendor && user.uid === vendor.uid;

  useEffect(() => {
    const trackView = async () => {
      const viewedKey = `viewed-product-${product!.id}`;
      if (!sessionStorage.getItem(viewedKey)) {
        const productRef = doc(db, 'products', product!.id);
        try {
          await updateDoc(productRef, { viewCount: increment(1) });
          sessionStorage.setItem(viewedKey, 'true');
        } catch (error) {
          console.error("Failed to track view:", error);
        }
      }
    };
    
    if(product && !isOwner) { // Only track views if the user is NOT the owner
        trackView();
    }
  }, [product, isOwner]);

  useEffect(() => {
    if (!carouselApi) return;
    setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on("select", () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  if (!product) {
    // This can be a loading state or a notFound() call if you re-fetch on client
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Check out this product on EliteHub: ${product.name}`,
      url: `https://www.elitehubng.com/products/${product.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast({ title: "Link Copied!", description: "Product link copied to clipboard." });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
          await navigator.clipboard.writeText(shareData.url);
          toast({ title: "Link Copied!", description: "Sharing was not available, so the link was copied instead." });
      }
    }
  };

  const handleAddToFavorites = async () => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Please log in',
            description: 'You need to be logged in to add products to your favorites.',
        });
        router.push('/login');
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

  const getWhatsAppLink = () => {
    if (!vendor?.whatsappNumber) return '';
    let number = vendor.whatsappNumber.replace(/\+/g, '').replace(/\s/g, '');
    if (number.startsWith('0')) {
      number = '234' + number.substring(1);
    }
    return `https://wa.me/${number}?text=Hello,%20I'm%20interested%20in%20your%20product%20'${product.name}'%20on%20Elitehub.`;
  };

  const isProductClosed = product.status === 'closed';
  const lawyerRecommendedCategories = ['Automobile', 'Property', 'Precious Metals & Minerals'];

  const isBadgeActive = (v: Vendor) => {
    if (!v.isVerified || !v.badgeExpirationDate) return false;
    return new Date(v.badgeExpirationDate) > new Date();
  };

  return (
    <div className="space-y-16">
      <Card className={cn("overflow-hidden shadow-xl", isProductClosed && "bg-muted/50")}>
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-4 relative">
             <Carousel setApi={setCarouselApi} className="w-full">
                <CarouselContent>
                  {product.images.map((imgSrc, index) => (
                    <CarouselItem key={index}>
                      <Image
                        src={imgSrc}
                        alt={`${product.name} - image ${index + 1}`}
                        width={800}
                        height={600}
                        className={cn("object-contain w-full h-auto rounded-lg", isProductClosed && "grayscale")}
                        data-ai-hint={product.dataAiHint}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
             </Carousel>
             <div className="flex justify-center gap-2 mt-4">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => carouselApi?.scrollTo(index)}
                    className={cn(
                      "h-2 w-2 rounded-full",
                      currentSlide === index ? "bg-primary" : "bg-muted-foreground/50"
                    )}
                  />
                ))}
              </div>
            {isProductClosed && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Badge variant="destructive" className="text-lg p-2">Out of Stock</Badge>
              </div>
            )}
          </div>
          <div className="p-8 flex flex-col justify-center">
            <Badge variant="secondary" className="w-fit mb-2">{product.category}</Badge>
            <h1 className="text-4xl font-bold font-headline">{product.name}</h1>
             {product.price && <p className="text-3xl font-bold text-primary mt-4">₦{product.price.toLocaleString()}</p>}
            <div className="flex items-center mt-4">
                <div className="flex items-center gap-0.5 text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-5 w-5 ${i < Math.round(product.rating) ? 'fill-current' : 'text-gray-300'}`} />
                    ))}
                </div>
                <span className="ml-2 text-sm text-muted-foreground">({product.reviewsCount} reviews)</span>
            </div>
            <Separator className="my-6" />
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>
             <Separator className="my-6" />
             <div className="grid grid-cols-2 gap-4 text-sm">
                 <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-muted-foreground">Category</p>
                        <p className="font-semibold">{product.category}</p>
                    </div>
                </div>

                 {product.type && (
                    <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">Type</p>
                            <p className="font-semibold">{product.type}</p>
                        </div>
                    </div>
                 )}
                 
                 {product.brand && (
                    <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">Brand</p>
                            <p className="font-semibold">{product.brand}</p>
                        </div>
                    </div>
                 )}

                 {product.condition && (
                     <div className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">Condition</p>
                            <p className="font-semibold capitalize">{product.condition}</p>
                        </div>
                    </div>
                 )}

                 {product.colors && (
                    <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">Color(s)</p>
                            <p className="font-semibold">{product.colors}</p>
                        </div>
                    </div>
                 )}
                
                {product.size && (
                    <div className="flex items-center gap-2">
                        <RectangleHorizontal className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">Size/Capacity</p>
                            <p className="font-semibold">{product.size}</p>
                        </div>
                    </div>
                )}

                {product.weight && (
                    <div className="flex items-center gap-2">
                        <Weight className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">Weight</p>
                            <p className="font-semibold">{product.weight}</p>
                        </div>
                    </div>
                )}

                {/* Property */}
                {product.category === 'Property' && product.address && (
                    <div className="flex items-center gap-2 col-span-2">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">Location</p>
                            <p className="font-semibold">{product.address}, {product.location}</p>
                        </div>
                    </div>
                )}

                {/* Automobile */}
                {product.category === 'Automobile' && (
                  <>
                    {product.make && product.model && (<div className="flex items-center gap-2"><Car className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Make & Model</p><p className="font-semibold">{product.make} {product.model}</p></div></div>)}
                    {product.year && (<div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Year</p><p className="font-semibold">{product.year}</p></div></div>)}
                    {product.mileage && (<div className="flex items-center gap-2"><Gauge className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Mileage</p><p className="font-semibold">{product.mileage?.toLocaleString()} km</p></div></div>)}
                    {product.transmission && (<div className="flex items-center gap-2"><GitCommitHorizontal className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Transmission</p><p className="font-semibold capitalize">{product.transmission}</p></div></div>)}
                    {product.fuelType && (<div className="flex items-center gap-2"><Droplets className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Fuel Type</p><p className="font-semibold capitalize">{product.fuelType}</p></div></div>)}
                  </>
                )}

                {/* Computers */}
                {product.category === 'Computers' && (
                    <>
                         {product.year && (<div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Year</p><p className="font-semibold">{product.year}</p></div></div>)}
                         {product.ram && (<div className="flex items-center gap-2"><MemoryStick className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">RAM</p><p className="font-semibold">{product.ram}</p></div></div>)}
                         {product.storage && (<div className="flex items-center gap-2"><HardDrive className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Storage</p><p className="font-semibold">{product.storage}</p></div></div>)}
                         {product.inches && (<div className="flex items-center gap-2"><RectangleHorizontal className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Screen</p><p className="font-semibold">{product.inches}</p></div></div>)}
                         {product.processorType && (<div className="flex items-center gap-2"><Cpu className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Processor</p><p className="font-semibold">{product.processorType} {product.generation}</p></div></div>)}
                         {product.dedicatedGraphicsMemory && (<div className="flex items-center gap-2"><Cpu className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Graphics</p><p className="font-semibold">{product.dedicatedGraphicsMemory}</p></div></div>)}
                    </>
                )}

                {/* Mobile Phones */}
                {product.category === 'Mobile Phones' && (
                    <>
                         {product.model && (<div className="flex items-center gap-2"><Tag className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Model</p><p className="font-semibold">{product.model}</p></div></div>)}
                         {product.ram && (<div className="flex items-center gap-2"><MemoryStick className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">RAM</p><p className="font-semibold">{product.ram}</p></div></div>)}
                         {product.storage && (<div className="flex items-center gap-2"><HardDrive className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Storage</p><p className="font-semibold">{product.storage}</p></div></div>)}
                         {product.batteryHealth && (<div className="flex items-center gap-2"><BatteryFull className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Battery Health</p><p className="font-semibold">{product.batteryHealth}</p></div></div>)}
                    </>
                )}

                {/* Electronics */}
                {product.category === 'Electronics' && (
                    <>
                         {product.model && (<div className="flex items-center gap-2"><Tag className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Model</p><p className="font-semibold">{product.model}</p></div></div>)}
                         {product.displayType && (<div className="flex items-center gap-2"><Tv className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Display</p><p className="font-semibold">{product.displayType}</p></div></div>)}
                         {product.year && (<div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Year</p><p className="font-semibold">{product.year}</p></div></div>)}
                         {product.connectivity && (<div className="flex items-center gap-2"><Bluetooth className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Connectivity</p><p className="font-semibold">{product.connectivity}</p></div></div>)}
                         {product.smart && (<div className="flex items-center gap-2"><Radio className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Smart</p><p className="font-semibold">Yes</p></div></div>)}
                    </>
                )}
                
                {/* Gaming */}
                {product.category === 'Gaming' && (
                    <>
                         {product.model && (<div className="flex items-center gap-2"><Gamepad2 className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Model</p><p className="font-semibold">{product.model}</p></div></div>)}
                         {product.connectivity && (<div className="flex items-center gap-2"><Bluetooth className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Connectivity</p><p className="font-semibold">{product.connectivity}</p></div></div>)}
                    </>
                )}

                 {/* Precious Metals & Minerals */}
                 {product.category === 'Precious Metals & Minerals' && (
                    <>
                        {product.preciousMetalType && (<div className="flex items-center gap-2"><Gem className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Metal Type</p><p className="font-semibold">{product.preciousMetalType}</p></div></div>)}
                        {product.purity && (<div className="flex items-center gap-2"><Atom className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Purity</p><p className="font-semibold">{product.purity}</p></div></div>)}
                        {product.weight && (<div className="flex items-center gap-2"><Weight className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Weight</p><p className="font-semibold">{product.weight}</p></div></div>)}
                        {product.form && (<div className="flex items-center gap-2"><Layers className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Form</p><p className="font-semibold">{product.form}</p></div></div>)}
                        {product.sourceOrigin && (<div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Source/Origin</p><p className="font-semibold">{product.sourceOrigin}</p></div></div>)}
                        {product.pricePerGram && (<div className="flex items-center gap-2"><Tag className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Price/Gram</p><p className="font-semibold">₦{product.pricePerGram.toLocaleString()}</p></div></div>)}
                        {product.assayCertificate && (<div className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Assay Certificate</p><p className="font-semibold">Available</p></div></div>)}
                        {product.serialNumber && (<div className="flex items-center gap-2"><Hash className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Serial Number</p><p className="font-semibold">{product.serialNumber}</p></div></div>)}
                    </>
                 )}
                 
                 {/* Fashion */}
                 {product.category === 'Fashion' && (
                    <>
                         {product.gender && (<div className="flex items-center gap-2"><PersonStanding className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Gender</p><p className="font-semibold">{product.gender}</p></div></div>)}
                    </>
                 )}

                {/* Accessories */}
                {product.category === 'Accessories' && (
                    <>
                        {product.model && (<div className="flex items-center gap-2"><Tag className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Model</p><p className="font-semibold">{product.model}</p></div></div>)}
                        {product.connectivity && (<div className="flex items-center gap-2"><Bluetooth className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Connectivity</p><p className="font-semibold">{product.connectivity}</p></div></div>)}
                        {product.mah && (<div className="flex items-center gap-2"><BatteryFull className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Capacity</p><p className="font-semibold">{product.mah} mAh</p></div></div>)}
                        {product.smart && (<div className="flex items-center gap-2"><Radio className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Smart</p><p className="font-semibold">Yes</p></div></div>)}
                    </>
                )}

                {/* Kitchenware */}
                {product.category === 'Kitchenware' && (
                    <>
                        {product.material && (<div className="flex items-center gap-2"><CookingPot className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Material</p><p className="font-semibold">{product.material}</p></div></div>)}
                        {product.powerSource && (<div className="flex items-center gap-2"><PowerIcon className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Power Source</p><p className="font-semibold">{product.powerSource}</p></div></div>)}
                    </>
                )}
                
                {/* Agriculture */}
                {product.category === 'Agriculture' && (
                    <>
                         {product.brand && (<div className="flex items-center gap-2"><Leaf className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Brand</p><p className="font-semibold">{product.brand}</p></div></div>)}
                    </>
                )}

                {/* Cosmetics */}
                {product.category === 'Cosmetics' && (
                    <>
                         {product.brand && (<div className="flex items-center gap-2"><Waves className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Brand</p><p className="font-semibold">{product.brand}</p></div></div>)}
                    </>
                )}
                
                {/* Internet Providers */}
                {product.category === 'Internet Providers' && (
                    <>
                         {product.model && (<div className="flex items-center gap-2"><Tag className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Model</p><p className="font-semibold">{product.model}</p></div></div>)}
                         {product.network && (<div className="flex items-center gap-2"><Radio className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Network</p><p className="font-semibold">{product.network}</p></div></div>)}
                         {product.speed && (<div className="flex items-center gap-2"><Gauge className="h-5 w-5 text-muted-foreground" /><div><p className="text-muted-foreground">Speed</p><p className="font-semibold">{product.speed}</p></div></div>)}
                    </>
                )}

                {/* Services */}
                { (product.category === 'Services' || product.category === 'Logistics' ) && product.serviceArea && (
                    <div className="flex items-center gap-2">
                        <Anchor className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">Service Area</p>
                            <p className="font-semibold">{product.serviceArea}</p>
                        </div>
                    </div>
                )}


                {vendor && (
                <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-muted-foreground">Sold by</p>
                        <div className="flex items-center gap-1.5">
                            <Link href={`/vendors/${vendor.id}`} className="font-semibold text-primary hover:underline">
                                {vendor.name}
                            </Link>
                            {isBadgeActive(vendor) && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                        <BadgeCheck className="h-4 w-4 text-green-500"/>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Verified Vendor</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                            )}
                            {vendor.tier === 'vip' && (
                                 <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                        <Crown className="h-4 w-4 text-yellow-500"/>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>VIP Vendor</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                            )}
                            {vendor.tier === 'vvip' && (
                                 <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                        <Gem className="h-4 w-4 text-purple-500"/>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>VVIP Vendor</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>
                </div>
                )}
             </div>

             {lawyerRecommendedCategories.includes(product.category) && (
                 <>
                    <Separator className="my-6" />
                    <div className="flex items-center gap-3 text-sm p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
                        <Scale className="h-8 w-8 flex-shrink-0" />
                        <div>
                            <h4 className="font-bold">Lawyer Recommended</h4>
                            <p className="text-xs">For your safety and to ensure a secure transaction, we highly recommend consulting with a lawyer. <Link href="/category/find-a-lawyer" className="font-semibold underline hover:text-blue-600">Find a lawyer here</Link>.</p>
                        </div>
                    </div>
                 </>
             )}


             {product.payOnDelivery && vendor && (
                <>
                    <Separator className="my-6" />
                    <div className="flex items-center gap-2 text-sm text-green-600">
                        <Truck className="h-5 w-5" />
                        <p className="font-semibold">Pay on Delivery available in {vendor.city}</p>
                    </div>
                </>
             )}


             <Separator className="my-6" />
             {isProductClosed ? (
                <div className="flex items-center justify-center gap-2 text-destructive border border-destructive rounded-md p-4">
                    <XCircle className="h-6 w-6"/>
                    <span className="font-semibold text-lg">This product is currently unavailable.</span>
                </div>
             ) : (
                 <div className="flex flex-col gap-4">
                     <div className="flex flex-col sm:flex-row gap-4">
                         <Button asChild size="lg" className="flex-1 text-lg py-6">
                             <a href={`tel:${vendor?.phoneNumber}`}>
                                 <Phone className="mr-2 h-6 w-6"/> Call Now
                             </a>
                         </Button>
                         {vendor?.whatsappNumber ? (
                            <Button asChild size="lg" className="flex-1 text-lg py-6 bg-green-600 hover:bg-green-700">
                                <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                                   <MessageSquare className="mr-2 h-6 w-6"/> WhatsApp
                                </a>
                            </Button>
                         ) : (
                            <Button size="lg" className="flex-1 text-lg py-6 bg-green-600 hover:bg-green-700" disabled>
                                <MessageSquare className="mr-2 h-6 w-6"/> WhatsApp
                            </Button>
                         )}
                    </div>
                     <div className="flex flex-col sm:flex-row gap-4">
                         <Button size="lg" variant="outline" className="flex-1 text-lg py-6" onClick={handleShare}>
                             <Share2 className="mr-2 h-6 w-6"/>
                             Share Product
                         </Button>
                         <Button size="lg" variant="outline" className="flex-1 text-lg py-6" onClick={handleAddToFavorites}>
                             <Heart className="mr-2 h-6 w-6"/>
                             Add to Favorites
                         </Button>
                     </div>
                 </div>
             )}
          </div>
        </div>
      </Card>

      {/* Safety Tips Section */}
      <SafetyTips />
      
      {/* Related Products */}
      {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold font-headline tracking-tight text-foreground mb-6">Related Products</h2>
            <ProductGrid products={relatedProducts} vendors={vendor ? [vendor] : []} />
          </div>
      )}

      {/* Customer Reviews */}
       <Reviews product={product} vendor={vendor} />
    </div>
  );
}
