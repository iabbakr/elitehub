

'use client';

import { useEffect, useState, useRef } from 'react';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { fetchCurrencyExchangeAgentById, type CurrencyExchangeAgent } from '@/lib/data';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Phone, MapPin, Star, Briefcase, Award, ArrowRightLeft, CircleDollarSign, Bitcoin, Wifi, Building, CheckCircle, Handshake, MessageCircle, Upload, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
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
import Link from 'next/link';

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


export default function AgentProfilePage() {
  const params = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [agent, setAgent] = useState<CurrencyExchangeAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;
  const isOwner = user && agent && user.uid === agent.uid;

  useEffect(() => {
    const loadData = async () => {
      if (!agentId) return;
      try {
        const fetchedAgent = await fetchCurrencyExchangeAgentById(agentId);
        setAgent(fetchedAgent);
        
        const ratedAgents = JSON.parse(localStorage.getItem('rated-agents') || '{}');
        if (user && ratedAgents[user.uid]?.includes(agentId)) {
            setHasRated(true);
        }

      } catch (error) {
        console.error("Failed to load agent data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [agentId, user]);

  const handleRatingSubmit = async (newRating: number) => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Please log in',
            description: 'You must be logged in to rate an agent.',
        });
        router.push('/login');
        return;
    }

    if (hasRated) {
        toast({
            title: 'Already Rated',
            description: 'You have already submitted a rating for this agent.',
        });
        return;
    }

    if (!agent) return;

    const agentRef = doc(db, 'currencyExchangeAgents', agent.id);

    try {
        await runTransaction(db, async (transaction) => {
            const agentDoc = await transaction.get(agentRef);
            if (!agentDoc.exists()) {
                throw "Agent does not exist!";
            }

            const currentData = agentDoc.data() as CurrencyExchangeAgent;
            const newRatingCount = (currentData.ratingCount || 0) + 1;
            const newTotalRating = (currentData.totalRating || 0) + newRating;
            const newAverageRating = newTotalRating / newRatingCount;

            transaction.update(agentRef, {
                ratingCount: newRatingCount,
                totalRating: newTotalRating,
                rating: newAverageRating,
            });

            setAgent(prev => prev ? ({ ...prev, rating: newAverageRating, ratingCount: newRatingCount }) : null);
        });
        
        const ratedAgents = JSON.parse(localStorage.getItem('rated-agents') || '{}');
        if (!ratedAgents[user.uid]) ratedAgents[user.uid] = [];
        ratedAgents[user.uid].push(agent.id);
        localStorage.setItem('rated-agents', JSON.stringify(ratedAgents));
        setHasRated(true);

        toast({ title: 'Rating Submitted!', description: `You rated ${agent.businessName} ${newRating} stars.` });

    } catch (error) {
        console.error("Error submitting rating: ", error);
        toast({ variant: 'destructive', title: 'Rating Failed', description: 'There was an error submitting your rating.' });
    }
  };


  const handleContact = () => {
    if (!agent) return;
    if (agent.whatsappNumber) {
        window.open(`https://wa.me/${agent.whatsappNumber}?text=Hello,%20From%20Elitehub`, '_blank');
    } else {
        window.location.href = `tel:${agent.phoneNumber}`;
    }
  };
  
    const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !agent) return;
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        toast({ title: 'Uploading Profile Picture...' });

        try {
            const imageUrl = await uploadToCloudinary(file);
            const agentRef = doc(db, 'currencyExchangeAgents', agent.id);
            await updateDoc(agentRef, { profileImage: imageUrl });
            setAgent(prev => prev ? { ...prev, profileImage: imageUrl } : null);
            toast({ title: 'Profile Picture Updated!' });
        } catch (error) {
            console.error("Profile picture upload failed: ", error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload image. Please try again.' });
        } finally {
            setIsUploading(false);
        }
    }


  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !agent) return;
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    if ((agent.galleryImages?.length || 0) >= 6) {
        toast({ variant: 'destructive', title: 'Gallery Full', description: 'You have reached the maximum of 6 images. Please delete an image to upload a new one.'});
        return;
    }

    if ((agent.galleryImages?.length || 0) + files.length > 6) {
        toast({ variant: 'destructive', title: 'Upload Limit Exceeded', description: `You can only add ${6 - (agent.galleryImages?.length || 0)} more image(s).`});
        return;
    }

    setIsUploading(true);
    toast({ title: 'Uploading Images...', description: 'Please wait while we add your images.'});
    
    try {
        const uploadPromises = files.map(file => uploadToCloudinary(file));
        const newImageUrls = await Promise.all(uploadPromises);
        
        const agentRef = doc(db, 'currencyExchangeAgents', agent.id);
        await updateDoc(agentRef, {
            galleryImages: [...(agent.galleryImages || []), ...newImageUrls]
        });

        setAgent(prev => prev ? ({ ...prev, galleryImages: [...(prev.galleryImages || []), ...newImageUrls]}) : null);
        toast({ title: 'Upload Successful!', description: 'Your gallery has been updated.' });

    } catch (error) {
        console.error("Gallery upload failed: ", error);
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload images. Please try again.' });
    } finally {
        setIsUploading(false);
    }
  };

    const handleDeleteImage = async (imageUrl: string) => {
        if (!agent) return;

        const updatedImages = agent.galleryImages?.filter(img => img !== imageUrl);

        try {
            const agentRef = doc(db, 'currencyExchangeAgents', agent.id);
            await updateDoc(agentRef, { galleryImages: updatedImages });

            setAgent(prev => prev ? { ...prev, galleryImages: updatedImages } : null);
            toast({ title: 'Image Deleted', description: 'The image has been removed from your gallery.' });
        } catch (error) {
            console.error("Error deleting image: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete the image.' });
        }
    };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!agent) {
    notFound();
  }

  const contactButtonText = agent.whatsappNumber ? 'WhatsApp' : 'Call Now';
  const ContactIcon = agent.whatsappNumber ? MessageCircle : Phone;
  const isProfileActive = agent.profileVisibleUntil && new Date(agent.profileVisibleUntil) > new Date();


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {isOwner && agent.kycStatus !== 'verified' && (
        <Card className={cn(
            "p-4 flex items-center justify-between",
            agent.kycStatus === 'pending' && "bg-blue-50 border-blue-200",
            agent.kycStatus === 'rejected' && "bg-destructive/10 border-destructive/20",
            (agent.kycStatus === 'none' || !agent.kycStatus) && "bg-amber-50 border-amber-200"
        )}>
            <div className="flex items-center gap-3">
                {agent.kycStatus === 'pending' && <Loader2 className="h-5 w-5 animate-spin text-blue-600"/>}
                {agent.kycStatus === 'rejected' && <AlertTriangle className="h-5 w-5 text-destructive"/>}
                {(agent.kycStatus === 'none' || !agent.kycStatus) && <AlertTriangle className="h-5 w-5 text-amber-600"/>}
                <div>
                    <h3 className="font-semibold">
                        {agent.kycStatus === 'pending' && "KYC Under Review"}
                        {agent.kycStatus === 'rejected' && "KYC Rejected"}
                        {(agent.kycStatus === 'none' || !agent.kycStatus) && "KYC Required"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {agent.kycStatus === 'pending' && "Your documents are being reviewed by our team."}
                        {agent.kycStatus === 'rejected' && "Please re-submit your documents for verification."}
                        {(agent.kycStatus === 'none' || !agent.kycStatus) && "Please submit your documents to get verified."}
                    </p>
                </div>
            </div>
            <Button asChild size="sm">
                <Link href="/kyc">
                    {agent.kycStatus === 'rejected' || agent.kycStatus === 'none' || !agent.kycStatus
                        ? "Submit Documents"
                        : "View Submission"}
                </Link>
            </Button>
        </Card>
      )}
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
                        src={agent.profileImage}
                        alt={`${agent.businessName} profile`}
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
                <h1 className="text-3xl md:text-4xl font-bold font-headline">{agent.businessName}</h1>
                <p className="text-lg text-muted-foreground">{agent.fullName}</p>
                 <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                    <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{agent.city}, {agent.location}</span>
                    </div>
                    {agent.kycStatus === 'verified' && (
                        <div className="flex items-center gap-1 text-sm text-green-600 font-semibold">
                            <ShieldCheck className="h-4 w-4" />
                            <span>KYC Verified</span>
                        </div>
                    )}
                 </div>
                 <div
                    className="flex items-center justify-center md:justify-start gap-1 text-yellow-500 mt-2"
                    onMouseLeave={() => setHoverRating(0)}
                    title={hasRated ? "You have already rated this agent" : "Click to rate"}
                 >
                    {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={cn(
                            'h-6 w-6',
                            !hasRated && 'cursor-pointer transition-transform hover:scale-125',
                            (hoverRating || Math.round(agent.rating || 0)) > i ? 'fill-current' : 'text-gray-300'
                        )}
                        onMouseEnter={() => !hasRated && setHoverRating(i + 1)}
                        onClick={() => handleRatingSubmit(i + 1)}
                    />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">
                        ({(agent.rating || 0).toFixed(1)} from {agent.ratingCount || 0} ratings)
                    </span>
                </div>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold mb-2">About Us</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{agent.bio}</p>
                    </div>
                     <div>
                        <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><ArrowRightLeft className="h-5 w-5"/> Accepted Currencies</h3>
                        <div className="flex flex-wrap gap-2">
                            {agent.currenciesAccepted.map(curr => (
                                <Badge key={curr} variant="secondary" className="gap-2">
                                    {curr === 'Fiat' ? <CircleDollarSign className="h-4 w-4" /> : <Bitcoin className="h-4 w-4" />}
                                    {curr}
                                </Badge>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><Handshake className="h-5 w-5"/> Transaction Methods</h3>
                        <div className="flex flex-wrap gap-2">
                            {agent.transactionTypes.map(type => (
                                <Badge key={type} variant="secondary">{type}</Badge>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Operation Mode</h3>
                         <div className="flex flex-wrap gap-4 text-muted-foreground text-sm">
                            {agent.operatesOnline && <div className="flex items-center gap-2"><Wifi className="h-4 w-4 text-green-500" /><span>Operates Online</span></div>}
                            {agent.hasPhysicalLocation && <div className="flex items-center gap-2"><Building className="h-4 w-4 text-green-500" /><span>Has Physical Location</span></div>}
                         </div>
                    </div>
                </div>
                <div className="space-y-4 pt-6 border-t md:border-t-0 md:border-l md:pl-8">
                     <h3 className="text-xl font-semibold">Contact Information</h3>
                     <div className="space-y-3">
                         <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground"/>
                            <a href={`tel:${agent.phoneNumber}`} className="text-primary hover:underline">{agent.phoneNumber}</a>
                         </div>
                         <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground"/>
                            <a href={`mailto:${agent.email}`} className="text-primary hover:underline">{agent.email}</a>
                         </div>
                         {agent.hasPhysicalLocation && agent.address && (
                             <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-muted-foreground mt-1"/>
                                <p className="text-sm">{agent.address}</p>
                             </div>
                         )}
                     </div>
                     <Button className="w-full" onClick={handleContact}>
                        <ContactIcon className="mr-2 h-4 w-4"/>
                        {contactButtonText}
                    </Button>
                </div>
            </div>

            { (agent.galleryImages && agent.galleryImages.length > 0) || isOwner ? (
                <div className="mt-8 pt-6 border-t">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Our Work in Pictures</h3>
                        {isOwner && (
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
                     {agent.galleryImages && agent.galleryImages.length > 0 ? (
                        <Carousel className="w-full">
                            <CarouselContent>
                            {agent.galleryImages.map((imgSrc, index) => (
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
                            <p>No gallery images uploaded yet.</p>
                            <p className="text-xs">Upload some images to showcase your work!</p>
                        </div>
                    )}
                </div>
            ) : null }
        </CardContent>
      </Card>
    </div>
  );
}
