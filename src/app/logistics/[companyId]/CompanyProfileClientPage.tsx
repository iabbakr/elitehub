
'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { type LogisticsCompany } from '@/lib/data';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Phone, MapPin, Truck, FileCheck2, Building, Star, MessageCircle, Upload, Edit, Trash2, ShieldCheck as KycIcon } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { LogisticsProfileForm } from '@/components/logistics/LogisticsProfileForm';
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
import { fetchLogisticsCompanyById } from '@/lib/data';


export function CompanyProfileClientPage({ initialCompany }: { initialCompany: LogisticsCompany }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [company, setCompany] = useState<LogisticsCompany | null>(initialCompany);
  const [loading, setLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  const companyId = company?.id;

  const isOwner = user && company && user.uid === company.uid;
  
  const refreshCompanyData = async () => {
    if (!companyId) return;
    const freshData = await fetchLogisticsCompanyById(companyId);
    if(freshData) {
      setCompany(freshData);
    }
  }


  useEffect(() => {
    const ratedCompanies = JSON.parse(localStorage.getItem('rated-logistics') || '{}');
    if (user && companyId && ratedCompanies[user.uid]?.includes(companyId)) {
        setHasRated(true);
    }
  }, [companyId, user]);

  const handleRatingSubmit = async (newRating: number) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Please log in', description: 'You must be logged in to rate a company.' });
        router.push('/login');
        return;
    }

    if (hasRated) {
        toast({ title: 'Already Rated', description: 'You have already submitted a rating for this company.' });
        return;
    }

    if (!company) return;

    const companyRef = doc(db, 'logisticsCompanies', company.id);

    try {
        await runTransaction(db, async (transaction) => {
            const companyDoc = await transaction.get(companyRef);
            if (!companyDoc.exists()) throw "Company does not exist!";

            const currentData = companyDoc.data() as LogisticsCompany;
            const newRatingCount = (currentData.ratingCount || 0) + 1;
            const newTotalRating = (currentData.totalRating || 0) + newRating;
            const newAverageRating = newTotalRating / newRatingCount;

            transaction.update(companyRef, {
                ratingCount: newRatingCount,
                totalRating: newTotalRating,
                rating: newAverageRating,
            });

            setCompany(prev => prev ? ({ ...prev, rating: newAverageRating, ratingCount: newRatingCount }) : null);
        });
        
        const ratedCompanies = JSON.parse(localStorage.getItem('rated-logistics') || '{}');
        if (!ratedCompanies[user.uid]) ratedCompanies[user.uid] = [];
        ratedCompanies[user.uid].push(company.id);
        localStorage.setItem('rated-logistics', JSON.stringify(ratedCompanies));
        setHasRated(true);

        toast({ title: 'Rating Submitted!', description: `You rated ${company.name} ${newRating} stars.` });

    } catch (error) {
        console.error("Error submitting rating: ", error);
        toast({ variant: 'destructive', title: 'Rating Failed', description: 'There was an error submitting your rating.' });
    }
  };

  const getWhatsAppLink = () => {
    if (!company?.whatsappNumber) return '';
    let number = company.whatsappNumber.replace(/\+/g, '').replace(/\s/g, '');
    if (number.startsWith('0')) {
      number = '234' + number.substring(1);
    }
    return `https://wa.me/${number}?text=Hello,%20From%20Elitehub`;
  };

  const handleContact = () => {
    if (!company) return;
    if (company.whatsappNumber) {
        window.open(getWhatsAppLink(), '_blank');
    } else {
        window.location.href = `tel:${company.phoneNumber}`;
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


   const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !company) return;
    const files = Array.from(e.target.files);

    if (files.length === 0) return;
    
    const maxUploads = company.tier === 'vvip' ? 6 : (company.tier === 'vip' ? 3 : 0);

    if ((company.galleryImages?.length || 0) >= maxUploads) {
        toast({ variant: 'destructive', title: 'Gallery Full', description: `You have reached the maximum of ${maxUploads} images. Please delete an image to upload a new one.`});
        return;
    }

    if ((company.galleryImages?.length || 0) + files.length > maxUploads) {
        toast({ variant: 'destructive', title: 'Upload Limit Exceeded', description: `You can only add ${maxUploads - (company.galleryImages?.length || 0)} more image(s).`});
        return;
    }

    setIsUploading(true);
    toast({ title: 'Uploading Images...', description: 'Please wait while we add your images.'});
    
    try {
        const uploadPromises = files.map(file => uploadToCloudinary(file));
        const newImageUrls = await Promise.all(uploadPromises);
        
        const companyRef = doc(db, 'logisticsCompanies', company.id);
        await updateDoc(companyRef, {
            galleryImages: [...(company.galleryImages || []), ...newImageUrls]
        });

        setCompany(prev => prev ? ({ ...prev, galleryImages: [...(prev.galleryImages || []), ...newImageUrls]}) : null);
        toast({ title: 'Upload Successful!', description: 'Your gallery has been updated.' });

    } catch (error) {
        console.error("Gallery upload failed: ", error);
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload images. Please try again.' });
    } finally {
        setIsUploading(false);
    }
  };

    const handleDeleteImage = async (imageUrl: string) => {
        if (!company) return;

        const updatedImages = company.galleryImages?.filter(img => img !== imageUrl);

        try {
            const companyRef = doc(db, 'logisticsCompanies', company.id);
            await updateDoc(companyRef, { galleryImages: updatedImages });

            setCompany(prev => prev ? { ...prev, galleryImages: updatedImages } : null);
            toast({ title: 'Image Deleted', description: 'The image has been removed from your gallery.' });
        } catch (error) {
            console.error("Error deleting image: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete the image.' });
        }
    };
    
      const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !company) return;
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        toast({ title: 'Uploading Profile Picture...' });

        try {
            const imageUrl = await uploadToCloudinary(file);
            const companyRef = doc(db, 'logisticsCompanies', company.id);
            await updateDoc(companyRef, { profileImage: imageUrl });
            setCompany(prev => prev ? { ...prev, profileImage: imageUrl } : null);
            toast({ title: 'Profile Picture Updated!' });
        } catch (error) {
            console.error("Profile picture upload failed: ", error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload image. Please try again.' });
        } finally {
            setIsUploading(false);
        }
    }


  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  if (!company) {
    return <div className="flex justify-center items-center h-64"><p>Company not found.</p></div>;
  }

  const contactButtonText = company.whatsappNumber ? 'WhatsApp' : 'Call Now';
  const ContactIcon = company.whatsappNumber ? MessageCircle : Phone;
  const isProfileActive = company.profileVisibleUntil && new Date(company.profileVisibleUntil) > new Date();
  const canViewGallery = company.tier === 'vip' || company.tier === 'vvip';


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
                    src={company.profileImage}
                    alt={`${company.name} profile`}
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
                <h1 className="text-3xl md:text-4xl font-bold font-headline">{company.name}</h1>
                 <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                    <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{company.city}, {company.location}</span>
                    </div>
                     {company.kycStatus === 'verified' && (
                        <div className="flex items-center gap-1 text-sm text-green-600 font-semibold">
                            <KycIcon className="h-4 w-4" />
                            <span>KYC Verified</span>
                        </div>
                    )}
                 </div>
                 <div className="flex items-center justify-center md:justify-start gap-1 text-yellow-500 mt-2" onMouseLeave={() => setHoverRating(0)} title={hasRated ? "You have already rated this company" : "Click to rate"} >
                    {[...Array(5)].map((_, i) => (
                    <Star key={i} className={cn('h-6 w-6', !hasRated && 'cursor-pointer transition-transform hover:scale-125', (hoverRating || Math.round(company.rating || 0)) > i ? 'fill-current' : 'text-gray-300')} onMouseEnter={() => !hasRated && setHoverRating(i + 1)} onClick={() => handleRatingSubmit(i + 1)} />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">({(company.rating || 0).toFixed(1)} from {company.ratingCount || 0} ratings)</span>
                </div>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold mb-2">About Us</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{company.bio}</p>
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
                                <DialogContent className="sm:max-w-2xl w-[95vw] h-[90vh] rounded-lg flex flex-col p-0">
                                    <LogisticsProfileForm
                                        company={company}
                                        onSuccess={() => {
                                            refreshCompanyData();
                                            setIsProfileFormOpen(false);
                                        }}
                                        onCancel={() => setIsProfileFormOpen(false)}
                                    />
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                     <div className="space-y-3">
                         <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-muted-foreground"/><a href={`tel:${company.phoneNumber}`} className="text-primary hover:underline">{company.phoneNumber}</a></div>
                         <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-muted-foreground"/><a href={`mailto:${company.email}`} className="text-primary hover:underline">{company.email}</a></div>
                         <div className="flex items-start gap-3"><Building className="h-5 w-5 text-muted-foreground mt-1"/><p className="text-sm">{company.address}</p></div>
                         {company.rcNumber && <div className="flex items-center gap-3"><FileCheck2 className="h-5 w-5 text-muted-foreground"/><span>RC: {company.rcNumber}</span></div>}
                     </div>
                     <Button className="w-full" onClick={handleContact}>
                        <ContactIcon className="mr-2 h-4 w-4"/>
                        {contactButtonText}
                    </Button>
                </div>
            </div>

            { (canViewGallery || isOwner) ? (
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
                     {company.galleryImages && company.galleryImages.length > 0 && canViewGallery ? (
                        <Carousel className="w-full">
                            <CarouselContent>
                            {company.galleryImages.map((imgSrc, index) => (
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
