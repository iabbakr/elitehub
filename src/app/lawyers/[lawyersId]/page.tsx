

'use client';

import { useEffect, useState, useRef } from 'react';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { fetchLawyerById, type Lawyer } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Phone, MapPin, Scale, Briefcase, Award, Star, MessageCircle, Crown, Gem, BadgeCheck, Upload, Edit, ShieldCheck as KycIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { doc, runTransaction, updateDoc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { LawyerProfileForm } from '@/components/lawyer/LawyerProfileForm';

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


export default function LawyerProfilePage() {
  const params = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [lawyer, setLawyer] = useState<Lawyer | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);

  const lawyerId = Array.isArray(params.lawyerId) ? params.lawyerId[0] : params.lawyerId;
  const isOwner = user && lawyer && user.uid === lawyer.uid;

  const refreshLawyerData = async () => {
    if (!lawyerId) return;
    const freshData = await fetchLawyerById(lawyerId);
    if(freshData) {
      setLawyer(freshData);
    }
  }


  useEffect(() => {
    const loadData = async () => {
      if (!lawyerId) return;
      try {
        const fetchedLawyer = await fetchLawyerById(lawyerId);
        setLawyer(fetchedLawyer);
        
        const ratedLawyers = JSON.parse(localStorage.getItem('rated-lawyers') || '{}');
        if (user && ratedLawyers[user.uid]?.includes(lawyerId)) {
            setHasRated(true);
        }

      } catch (error) {
        console.error("Failed to load lawyer data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [lawyerId, user]);

  const handleRatingSubmit = async (newRating: number) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Please log in', description: 'You must be logged in to rate a lawyer.' });
        router.push('/login');
        return;
    }

    if (isOwner) {
        toast({ title: 'Action Not Allowed', description: 'You cannot rate your own profile.' });
        return;
    }

    if (hasRated) {
        toast({ title: 'Already Rated', description: 'You have already submitted a rating for this lawyer.' });
        return;
    }

    if (!lawyer) return;

    const lawyerRef = doc(db, 'lawyers', lawyer.id);

    try {
        await runTransaction(db, async (transaction) => {
            const lawyerDoc = await transaction.get(lawyerRef);
            if (!lawyerDoc.exists()) throw "Lawyer does not exist!";

            const currentData = lawyerDoc.data() as Lawyer;
            const newRatingCount = (currentData.ratingCount || 0) + 1;
            const newTotalRating = (currentData.totalRating || 0) + newRating;
            const newAverageRating = newTotalRating / newRatingCount;

            transaction.update(lawyerRef, {
                ratingCount: newRatingCount,
                totalRating: newTotalRating,
                rating: newAverageRating,
            });

            setLawyer(prev => prev ? ({ ...prev, rating: newAverageRating, ratingCount: newRatingCount }) : null);
        });
        
        const ratedLawyers = JSON.parse(localStorage.getItem('rated-lawyers') || '{}');
        if (!ratedLawyers[user.uid]) ratedLawyers[user.uid] = [];
        ratedLawyers[user.uid].push(lawyer.id);
        localStorage.setItem('rated-lawyers', JSON.stringify(ratedLawyers));
        setHasRated(true);

        toast({ title: 'Rating Submitted!', description: `You rated ${lawyer.fullName} ${newRating} stars.` });

    } catch (error) {
        console.error("Error submitting rating: ", error);
        toast({ variant: 'destructive', title: 'Rating Failed', description: 'There was an error submitting your rating.' });
    }
  };


  const handleContact = () => {
    if (!lawyer) return;
    if (lawyer.whatsappNumber) {
        window.open(`https://wa.me/${lawyer.whatsappNumber}?text=Hello,%20From%20Elitehub`, '_blank');
    } else {
        window.location.href = `tel:${lawyer.phoneNumber}`;
    }
  };
  
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !lawyer) return;
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    toast({ title: 'Uploading Profile Picture...' });

    try {
        const imageUrl = await uploadToCloudinary(file);
        const lawyerRef = doc(db, 'lawyers', lawyer.id);
        await updateDoc(lawyerRef, { profileImage: imageUrl });
        setLawyer(prev => prev ? { ...prev, profileImage: imageUrl } : null);
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
  
  if (!lawyer) {
    notFound();
  }
  
  const contactButtonText = lawyer.whatsappNumber ? 'WhatsApp' : 'Call Now';
  const ContactIcon = lawyer.whatsappNumber ? MessageCircle : Phone;

  const canRate = !isOwner && !hasRated;
  const isProfileActive = lawyer.profileVisibleUntil && new Date(lawyer.profileVisibleUntil) > new Date();

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
                        src={lawyer.profileImage}
                        alt={`${lawyer.fullName} profile`}
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
                    <span>{lawyer.fullName}</span>
                    {lawyer.isVerified && <BadgeCheck className="h-8 w-8 text-green-500" />}
                    {lawyer.tier === 'vip' && <Crown className="h-8 w-8 text-yellow-500" />}
                    {lawyer.tier === 'vvip' && <Gem className="h-8 w-8 text-purple-500" />}
                </h1>
                <p className="text-lg text-muted-foreground">{lawyer.tagline}</p>
                 <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                    <div className="flex items-center gap-1 text-sm">
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        <span>SCN: {lawyer.scn}</span>
                    </div>
                     <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{lawyer.city}, {lawyer.location}</span>
                    </div>
                    {lawyer.kycStatus === 'verified' && (
                        <div className="flex items-center gap-1 text-sm text-green-600 font-semibold">
                            <KycIcon className="h-4 w-4" />
                            <span>KYC Verified</span>
                        </div>
                    )}
                 </div>
                 <div
                    className="flex items-center justify-center md:justify-start gap-1 text-yellow-500 mt-2"
                    onMouseLeave={() => canRate && setHoverRating(0)}
                    title={isOwner ? "You cannot rate your own profile" : (hasRated ? "You have already rated this lawyer" : "Click to rate")}
                 >
                    {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={cn(
                            'h-6 w-6',
                            canRate && 'cursor-pointer transition-transform hover:scale-125',
                            (hoverRating || Math.round(lawyer.rating || 0)) > i ? 'fill-current' : 'text-gray-300'
                        )}
                        onMouseEnter={() => canRate && setHoverRating(i + 1)}
                        onClick={() => canRate && handleRatingSubmit(i + 1)}
                    />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">
                        ({(lawyer.rating || 0).toFixed(1)} from {lawyer.ratingCount || 0} ratings)
                    </span>
                </div>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold mb-2">About Me</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{lawyer.bio}</p>
                    </div>
                     <div>
                        <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><Briefcase className="h-5 w-5"/> Practice Areas</h3>
                        <div className="flex flex-wrap gap-2">
                            {lawyer.practiceAreas.map(area => (
                                <Badge key={area} variant="secondary">{area}</Badge>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><Award className="h-5 w-5"/> Experience</h3>
                        <p className="text-muted-foreground">{lawyer.yearsOfExperience} years of experience</p>
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
                                    <LawyerProfileForm
                                        lawyer={lawyer}
                                        onSuccess={() => {
                                            refreshLawyerData();
                                            setIsProfileFormOpen(false);
                                        }}
                                        onCancel={() => setIsProfileFormOpen(false)}
                                    />
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                     <div className="space-y-3">
                         <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground"/>
                            <a href={`tel:${lawyer.phoneNumber}`} className="text-primary hover:underline">{lawyer.phoneNumber}</a>
                         </div>
                         <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground"/>
                            <a href={`mailto:${lawyer.email}`} className="text-primary hover:underline">{lawyer.email}</a>
                         </div>
                     </div>
                     <Button className="w-full" onClick={handleContact}>
                        <ContactIcon className="mr-2 h-4 w-4"/>
                        {contactButtonText}
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
