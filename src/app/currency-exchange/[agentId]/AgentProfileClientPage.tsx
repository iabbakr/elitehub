
'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { type CurrencyExchangeAgent } from '@/lib/data';
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
import Link from 'next/link';


export function AgentProfileClientPage({ initialAgent }: { initialAgent: CurrencyExchangeAgent }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [agent, setAgent] = useState<CurrencyExchangeAgent>(initialAgent);
  const [loading, setLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = user && agent && user.uid === agent.uid;

  useEffect(() => {
    const ratedAgents = JSON.parse(localStorage.getItem('rated-agents') || '{}');
    if (user && ratedAgents[user.uid]?.includes(agent.id)) {
        setHasRated(true);
    }
  }, [agent.id, user]);

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

            setAgent(prev => prev ? ({ ...prev, rating: newAverageRating, ratingCount: newRatingCount }) : prev);
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

  const getWhatsAppLink = () => {
    if (!agent.whatsappNumber) return '';
    let number = agent.whatsappNumber.replace(/\+/g, '').replace(/\s/g, '');
    if (number.startsWith('0')) {
      number = '234' + number.substring(1);
    }
    return `https://wa.me/${number}?text=Hello,%20From%20Elitehub`;
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
        if (!e.target.files || !agent) return;
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        toast({ title: 'Uploading Profile Picture...' });

        try {
            const imageUrl = await uploadToCloudinary(file);
            const agentRef = doc(db, 'currencyExchangeAgents', agent.id);
            await updateDoc(agentRef, { profileImage: imageUrl });
            setAgent(prev => prev ? { ...prev, profileImage: imageUrl } : prev);
            toast({ title: 'Profile Picture Updated!' });
        } catch (error) {
            console.error("Profile picture upload failed: ", error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload image. Please try again.' });
        } finally {
            setIsUploading(false);
        }
    }


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
                         {agent.hasPhysicalLocation && agent.address && (
                             <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-muted-foreground mt-1"/>
                                <p className="text-sm">{agent.address}</p>
                             </div>
                         )}
                     </div>
                     <div className="flex flex-col gap-2">
                        <Button asChild className="w-full">
                           <a href={`tel:${agent.phoneNumber}`}><Phone className="mr-2 h-4 w-4"/> Call Now</a>
                        </Button>
                        <Button asChild variant="secondary" className="w-full">
                             <a href={`mailto:${agent.email}`}><Mail className="mr-2 h-4 w-4"/> Email</a>
                        </Button>
                        {agent.whatsappNumber ? (
                          <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                             <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-4 w-4"/> WhatsApp</a>
                          </Button>
                        ) : (
                          isOwner && (
                            <div className="text-center text-xs text-muted-foreground p-2 bg-muted rounded-md">
                                Add your WhatsApp number to activate this button.
                            </div>
                          )
                        )}
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
