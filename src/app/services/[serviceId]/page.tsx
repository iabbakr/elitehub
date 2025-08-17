
'use client';

import { useEffect, useState, useRef } from 'react';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { fetchServiceProviderById, type ServiceProvider, fetchServiceProviders } from '@/lib/data';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Phone, MapPin, Star, Building, Wifi, Wrench, FileCheck2, MessageCircle, Upload, Crown, Gem, BadgeCheck, Trash2, Edit, ShieldCheck as KycIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { doc, runTransaction, updateDoc } from 'firebase/firestore';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
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
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ServiceProfileForm } from '@/components/service/ServiceProfileForm';
import type { Metadata } from 'next';

type Props = {
  params: { serviceId: string }
}

export async function generateStaticParams() {
  const providers = await fetchServiceProviders();
  return providers.map((provider) => ({
    serviceId: provider.id,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const provider = await fetchServiceProviderById(params.serviceId);

  if (!provider) {
    return {
      title: 'Service Provider Not Found',
      description: 'The service provider you are looking for does not exist on our platform.',
    };
  }

  const shortDescription = provider.bio.substring(0, 155);

  return {
    title: `${provider.businessName} - ${provider.serviceType} in ${provider.location}`,
    description: shortDescription,
    keywords: [provider.businessName, provider.serviceType, provider.serviceCategory, 'nigeria'],
    openGraph: {
      title: `${provider.businessName} on EliteHub Marketplace`,
      description: shortDescription,
      images: [
        {
          url: provider.profileImage,
          width: 200,
          height: 200,
          alt: `${provider.businessName} logo`,
        },
      ],
      url: `https://www.elitehubng.com/services/${provider.id}`,
      siteName: 'EliteHub Marketplace',
      type: 'profile',
    },
     alternates: {
      canonical: `https://www.elitehubng.com/services/${provider.id}`,
    },
  };
}


export default function ServiceProviderProfilePage({ params }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  const serviceId = params.serviceId;
  
  const isOwner = user && provider && user.uid === provider.uid;

   const refreshProviderData = async () => {
    if (!serviceId) return;
    const freshData = await fetchServiceProviderById(serviceId);
    if(freshData) {
      setProvider(freshData);
    }
  }


  useEffect(() => {
    const loadData = async () => {
      if (!serviceId) return;
      try {
        const fetchedProvider = await fetchServiceProviderById(serviceId);
        setProvider(fetchedProvider);
        
        const ratedProviders = JSON.parse(localStorage.getItem('rated-providers') || '{}');
        if (user && ratedProviders[user.uid]?.includes(serviceId)) {
            setHasRated(true);
        }

      } catch (error) {
        console.error("Failed to load provider data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [serviceId, user]);

  const handleRatingSubmit = async (newRating: number) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Please log in', description: 'You must be logged in to rate a provider.' });
        router.push('/login');
        return;
    }

    if (isOwner) {
        toast({ title: 'Action Not Allowed', description: 'You cannot rate your own profile.' });
        return;
    }

    if (hasRated) {
        toast({ title: 'Already Rated', description: 'You have already submitted a rating for this provider.' });
        return;
    }

    if (!provider) return;

    const providerRef = doc(db, 'serviceProviders', provider.id);

    try {
        await runTransaction(db, async (transaction) => {
            const providerDoc = await transaction.get(providerRef);
            if (!providerDoc.exists()) throw "Provider does not exist!";

            const currentData = providerDoc.data() as ServiceProvider;
            const newRatingCount = (currentData.ratingCount || 0) + 1;
            const newTotalRating = (currentData.totalRating || 0) + newRating;
            const newAverageRating = newTotalRating / newRatingCount;

            transaction.update(providerRef, {
                ratingCount: newRatingCount,
                totalRating: newTotalRating,
                rating: newAverageRating,
            });

            setProvider(prev => prev ? ({ ...prev, rating: newAverageRating, ratingCount: newRatingCount }) : null);
        });
        
        const ratedProviders = JSON.parse(localStorage.getItem('rated-providers') || '{}');
        if (!ratedProviders[user.uid]) ratedProviders[user.uid] = [];
        ratedProviders[user.uid].push(provider.id);
        localStorage.setItem('rated-providers', JSON.stringify(ratedProviders));
        setHasRated(true);

        toast({ title: 'Rating Submitted!', description: `You rated ${provider.businessName} ${newRating} stars.` });

    } catch (error) {
        console.error("Error submitting rating: ", error);
        toast({ variant: 'destructive', title: 'Rating Failed', description: 'There was an error submitting your rating.' });
    }
  };


  const handleContact = () => {
    if (!provider) return;
    if (provider.whatsappNumber) {
        window.open(`https://wa.me/${provider.whatsappNumber}?text=Hello,%20From%20Elitehub`, '_blank');
    } else {
        window.location.href = `tel:${provider.phoneNumber}`;
    }
  };

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error?.message || 'Upload failed');
    }
    return data.secure_url;
};


  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !provider) return;
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    toast({ title: 'Uploading Profile Picture...' });

    try {
        const imageUrl = await uploadToCloudinary(file);
        const providerRef = doc(db, 'serviceProviders', provider.id);
        await updateDoc(providerRef, { profileImage: imageUrl });
        setProvider(prev => prev ? { ...prev, profileImage: imageUrl } : null);
        toast({ title: 'Profile Picture Updated!' });
    } catch (error) {
        console.error("Profile picture upload failed: ", error);
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload image. Please try again.' });
    } finally {
        setIsUploading(false);
    }
  }


  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !provider) return;
    const files = Array.from(e.target.files);

    if (files.length === 0) return;
    
    const maxUploads = provider.tier === 'vvip' ? 6 : (provider.tier === 'vip' ? 3 : 0);

    if ((provider.galleryImages?.length || 0) >= maxUploads) {
        toast({ variant: 'destructive', title: 'Gallery Full', description: `You have reached the maximum of ${maxUploads} images for your tier.`});
        return;
    }
    
    if ((provider.galleryImages?.length || 0) + files.length > maxUploads) {
        toast({ variant: 'destructive', title: 'Upload Limit Exceeded', description: `You can only add ${maxUploads - (provider.galleryImages?.length || 0)} more image(s).`});
        return;
    }

    setIsUploading(true);
    toast({ title: 'Uploading Images...', description: 'Please wait while we add your images.'});
    
    try {
        const uploadPromises = files.map(file => uploadToCloudinary(file));
        const newImageUrls = await Promise.all(uploadPromises);
        
        const providerRef = doc(db, 'serviceProviders', provider.id);
        await updateDoc(providerRef, {
            galleryImages: [...(provider.galleryImages || []), ...newImageUrls]
        });

        setProvider(prev => prev ? ({ ...prev, galleryImages: [...(prev.galleryImages || []), ...newImageUrls]}) : null);
        toast({ title: 'Upload Successful!', description: 'Your gallery has been updated.' });

    } catch (error) {
        console.error("Gallery upload failed: ", error);
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload images. Please try again.' });
    } finally {
        setIsUploading(false);
    }
  };

    const handleDeleteImage = async (imageUrl: string) => {
        if (!provider) return;

        const updatedImages = provider.galleryImages?.filter(img => img !== imageUrl);

        try {
            const providerRef = doc(db, 'serviceProviders', provider.id);
            await updateDoc(providerRef, { galleryImages: updatedImages });

            setProvider(prev => prev ? { ...prev, galleryImages: updatedImages } : null);
            toast({ title: 'Image Deleted', description: 'The image has been removed from your gallery.' });
        } catch (error) {
            console.error("Error deleting image: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete the image.' });
        }
    };


  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  if (!provider) {
    notFound();
  }
  
  const canRate = !isOwner && !hasRated;
  const canViewGallery = provider.tier === 'vip' || provider.tier === 'vvip';
  const isProfileActive = provider.profileVisibleUntil && new Date(provider.profileVisibleUntil) > new Date();


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="overflow-hidden shadow-lg relative">
        {isOwner && (
            <Badge className={cn(
              "absolute top-4 right-4 text-sm",
              isProfileActive ? 'bg-green-100 text-green-800' : 'bg-destructive/10 text-destructive'
            )}>
              {isProfileActive ? 'Active' : 'Inactive'}
            </Badge>
          )}
        <CardHeader className="bg-muted/30 p-8">
           <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                    <Image
                        src={provider.profileImage}
                        alt={`${provider.businessName} profile`}
                        width={128}
                        height={128}
                        className="rounded-full border-4 border-card bg-card shadow-lg"
                    />
                     {isOwner && (
                        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
                             <Button variant="outline" size="icon" onClick={() => profileInputRef.current?.click()} disabled={isUploading}>
                                 {isUploading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Upload className="h-4 w-4"/>}
                             </Button>
                        </div>
                     )}
               </div>
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold font-headline flex items-center justify-center md:justify-start gap-2">
                    <span>{provider.businessName}</span>
                    {provider.isVerified && <BadgeCheck className="h-8 w-8 text-green-500" />}
                    {provider.tier === 'vip' && <Crown className="h-8 w-8 text-yellow-500" />}
                    {provider.tier === 'vvip' && <Gem className="h-8 w-8 text-purple-500" />}
                </h1>
                <p className="text-lg text-muted-foreground">{provider.fullName}</p>
                 <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                    <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{provider.city}, {provider.location}</span>
                    </div>
                     {provider.kycStatus === 'verified' && (
                        <div className="flex items-center gap-1 text-sm text-green-600 font-semibold">
                            <KycIcon className="h-4 w-4" />
                            <span>KYC Verified</span>
                        </div>
                    )}
                 </div>
                 <div className="flex items-center justify-center md:justify-start gap-1 text-yellow-500 mt-2" onMouseLeave={() => canRate && setHoverRating(0)} title={isOwner ? "You cannot rate your own profile" : (hasRated ? "You have already rated" : "Click to rate")}>
                    {[...Array(5)].map((_, i) => (
                    <Star key={i} className={cn('h-6 w-6', canRate && 'cursor-pointer transition-transform hover:scale-125', (hoverRating || Math.round(provider.rating || 0)) > i ? 'fill-current' : 'text-gray-300')} onMouseEnter={() => canRate && setHoverRating(i + 1)} onClick={() => canRate && handleRatingSubmit(i + 1)}/>
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">({(provider.rating || 0).toFixed(1)} from {provider.ratingCount || 0} ratings)</span>
                </div>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold mb-2">About Us</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{provider.bio}</p>
                    </div>
                     <div>
                        <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><Wrench className="h-5 w-5"/> Services Offered</h3>
                        <div className="flex flex-wrap gap-2">
                           <Badge variant="secondary">{provider.serviceCategory}</Badge>
                           <Badge>{provider.serviceType}</Badge>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Operation Mode</h3>
                         <div className="flex flex-wrap gap-4 text-muted-foreground text-sm">
                            {provider.operatesOnline && <div className="flex items-center gap-2"><Wifi className="h-4 w-4 text-green-500" /><span>Operates Online</span></div>}
                            {provider.hasPhysicalLocation && <div className="flex items-center gap-2"><Building className="h-4 w-4 text-green-500" /><span>Has Physical Location</span></div>}
                         </div>
                    </div>
                </div>
                <div className="space-y-4 pt-6 border-t md:border-t-0 md:border-l md:pl-8">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold">Contact Information</h3>
                        {isOwner && (
                            <Dialog open={isProfileFormOpen} onOpenChange={setIsProfileFormOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                    <Edit className="mr-2 h-4 w-4"/>
                                    Edit
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-xl">
                                    <ServiceProfileForm
                                        provider={provider}
                                        onSuccess={() => {
                                            refreshProviderData();
                                            setIsProfileFormOpen(false);
                                        }}
                                        onCancel={() => setIsProfileFormOpen(false)}
                                    />
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                     <div className="space-y-3">
                         <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-muted-foreground"/><a href={`tel:${provider.phoneNumber}`} className="text-primary hover:underline">{provider.phoneNumber}</a></div>
                         <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-muted-foreground"/><a href={`mailto:${provider.email}`} className="text-primary hover:underline">{provider.email}</a></div>
                         {provider.hasPhysicalLocation && provider.address && (<div className="flex items-start gap-3"><MapPin className="h-5 w-5 text-muted-foreground mt-1"/><p className="text-sm">{provider.address}</p></div>)}
                         {provider.rcNumber && (
                           <div className="flex items-center gap-3">
                             <FileCheck2 className="h-5 w-5 text-muted-foreground" />
                             <span>RC: {provider.rcNumber}</span>
                           </div>
                         )}
                     </div>
                      <div className="flex flex-col gap-2">
                        <Button asChild className="w-full">
                           <a href={`tel:${provider.phoneNumber}`}><Phone className="mr-2 h-4 w-4"/> Call Now</a>
                        </Button>
                        <Button asChild variant="secondary" className="w-full">
                             <a href={`mailto:${provider.email}`}><Mail className="mr-2 h-4 w-4"/> Email</a>
                        </Button>
                        {provider.whatsappNumber ? (
                          <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                             <a href={`https://wa.me/${provider.whatsappNumber}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-4 w-4"/> WhatsApp</a>
                          </Button>
                        ) : (
                          isOwner && (
                            <div className="text-center text-xs text-muted-foreground p-2 bg-muted rounded-md">
                                Add your WhatsApp number in the 'Edit' section to activate this button.
                            </div>
                          )
                        )}
                    </div>
                </div>
            </div>
             { canViewGallery || isOwner ? (
                <div className="mt-8 pt-6 border-t">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Our Work in Pictures</h3>
                        {isOwner && canViewGallery && (
                             <>
                                <input 
                                    type="file" 
                                    ref={galleryInputRef}
                                    className="hidden" 
                                    multiple 
                                    accept="image/*"
                                    onChange={handleGalleryUpload}
                                />
                                <Button onClick={() => galleryInputRef.current?.click()} disabled={isUploading}>
                                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    Upload Images
                                </Button>
                            </>
                        )}
                    </div>
                     {provider.galleryImages && provider.galleryImages.length > 0 && canViewGallery ? (
                        <Carousel className="w-full">
                            <CarouselContent>
                            {provider.galleryImages.map((imgSrc, index) => (
                                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                                <div className="p-1">
                                    <Card className="group">
                                        <CardContent className="relative flex aspect-square items-center justify-center p-0">
                                            <Image
                                                src={imgSrc}
                                                alt={`Gallery image ${index + 1}`}
                                                width={400}
                                                height={400}
                                                className="rounded-lg object-cover w-full h-full"
                                            />
                                            {isOwner && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Delete Image</span>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the image from your gallery.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteImage(imgSrc)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                                </CarouselItem>
                            ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                        </Carousel>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                            <p>{canViewGallery ? "No gallery images uploaded yet." : "Upgrade to a VIP or VVIP plan to showcase your work."}</p>
                            {isOwner && canViewGallery && <p className="text-xs">Upload some images to showcase your work!</p>}
                        </div>
                    )}
                </div>
            ) : null }
        </CardContent>
      </Card>
    </div>
  );
}
