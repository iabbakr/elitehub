
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { type Product, type Vendor } from '@/lib/data';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  Edit,
  Upload,
  AlertTriangle,
  Loader2,
  Package,
} from 'lucide-react';
import { VendorProfileForm } from '@/components/vendor/VendorProfileForm';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import { VendorStats } from './VendorStats';

interface VendorDashboardProps {
  vendor: Vendor;
  products: Product[];
}

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


export function VendorDashboard({ vendor: initialVendor, products }: VendorDashboardProps) {
    const { toast } = useToast();
    const [vendor, setVendor] = useState(initialVendor);
    const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'profileImage' | 'bannerImage') => {
        if (!e.target.files) return;
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        toast({ title: 'Uploading Image...' });

        try {
            const imageUrl = await uploadToCloudinary(file);
            const vendorRef = doc(db, 'vendors', vendor.id);
            await updateDoc(vendorRef, { [field]: imageUrl });
            setVendor(prev => ({ ...prev, [field]: imageUrl }));
            toast({ title: 'Image Updated!' });
        } catch (error) {
            console.error("Image upload failed: ", error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload image. Please try again.' });
        } finally {
            setIsUploading(false);
        }
    }
  
  const isBadgeActive = (v: Vendor) => {
    if (!v.isVerified || !v.badgeExpirationDate) return false;
    return new Date(v.badgeExpirationDate) > new Date();
  };

  return (
    <div className="space-y-8">
      {vendor.status === 'banned' && (
        <Card className="bg-destructive/10 border-destructive text-destructive-foreground">
            <CardHeader className="flex flex-row items-center gap-4">
                <AlertTriangle className="h-8 w-8"/>
                <div>
                    <CardTitle>Account Banned</CardTitle>
                    <CardDescription className="text-destructive-foreground/80">
                        Your account has been banned due to a violation of our terms of service. Please contact support for more information.
                    </CardDescription>
                </div>
            </CardHeader>
        </Card>
      )}
      <Card className="overflow-hidden shadow-lg">
        <div className="relative h-48 md:h-64 w-full group">
          <Image
            src={vendor.bannerImage}
            alt={`${vendor.name} banner`}
            layout="fill"
            objectFit="cover"
            data-ai-hint="store banner"
          />
          <div className="absolute inset-0 bg-black/40" />
           <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleProfileImageUpload(e, 'bannerImage')} />
                    <Button variant="outline" asChild>
                        <span><Upload className="mr-2"/> Change Banner</span>
                    </Button>
                </label>
           </div>
        </div>
        <div className="p-6 md:p-8 bg-card relative -mt-20 md:-mt-24">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
                <Image
                  src={vendor.profileImage}
                  alt={`${vendor.name} logo`}
                  width={160}
                  height={160}
                  className="rounded-full border-4 border-card bg-card shadow-lg"
                  data-ai-hint={vendor.dataAiHint}
                />
                 <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className="cursor-pointer">
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleProfileImageUpload(e, 'profileImage')} />
                        <Button variant="outline" asChild>
                            <span><Upload className="mr-2"/> Change Photo</span>
                        </Button>
                    </label>
               </div>
            </div>
            <div className="text-center md:text-left mt-4 md:mt-0">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-3xl md:text-4xl font-bold font-headline">{vendor.name}</h1>
                 {isBadgeActive(vendor) && <BadgeCheck className="h-8 w-8 text-green-500" />}
                 {vendor.tier === 'vip' && <Crown className="h-8 w-8 text-yellow-500" />}
                 {vendor.tier === 'vvip' && <Gem className="h-8 w-8 text-purple-500" />}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3">
                 <div className="flex items-center justify-center md:justify-start gap-1 text-yellow-500 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-6 w-6 ${i < Math.round(vendor.rating) ? 'fill-current' : 'text-gray-300'}`} />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">({vendor.rating.toFixed(1)} from {vendor.ratingCount || 0} ratings)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <VendorStats vendor={vendor} products={products} />
      
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Vendor Information</CardTitle>
           <Dialog open={isProfileFormOpen} onOpenChange={setIsProfileFormOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline"><Edit className="mr-2 h-4 w-4"/>Edit Profile</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl w-[95vw] h-[90vh] rounded-lg flex flex-col p-0">
                    <VendorProfileForm vendor={vendor} onSuccess={() => setIsProfileFormOpen(false)} onCancel={() => setIsProfileFormOpen(false)} />
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="text-muted-foreground pb-4">{vendor.businessDescription}</p>

            <Separator />
            <div className="flex items-start gap-3 pt-4">
                <User className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                <p className="font-semibold">Full Name</p>
                <p className="text-muted-foreground">{vendor.fullname}</p>
                </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3 pt-4">
                <Phone className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                <p className="font-semibold">Phone</p>
                <p className="text-muted-foreground">{vendor.phoneNumber}</p>
                </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3 pt-4">
                <Mail className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                <p className="font-semibold">Email</p>
                <p className="text-muted-foreground">{vendor.email}</p>
                </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3 pt-4">
                <Home className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                <p className="font-semibold">Address</p>
                <p className="text-muted-foreground">{vendor.address}, {vendor.city}, {vendor.location}</p>
                </div>
            </div>
            {vendor.rcNumber && (
                <>
                    <Separator />
                    <div className="flex items-start gap-3 pt-4">
                        <FileCheck2 className="h-5 w-5 text-muted-foreground mt-1" />
                        <div>
                        <p className="font-semibold">RC Number</p>
                        <p className="text-muted-foreground">{vendor.rcNumber}</p>
                        </div>
                    </div>
                </>
            )}
            <Separator />
            <div className="flex items-start gap-3 pt-4">
                 <Package className="h-5 w-5 text-muted-foreground mt-1" />
                 <div>
                    <p className="font-semibold">Post Count</p>
                    <p className="text-muted-foreground">{products.length} / {vendor.postLimit === -1 ? 'Unlimited' : vendor.postLimit}</p>
                 </div>
            </div>
        </CardContent>
      </Card>
      
      

    </div>
  );
}
