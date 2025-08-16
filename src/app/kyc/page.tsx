
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { fetchProviderDataByUid, type CurrencyExchangeAgent } from '@/lib/data';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const kycFormSchema = z.object({
  idCardFront: z.any().refine((files) => files?.length === 1, 'Front of ID is required.'),
  idCardBack: z.any().refine((files) => files?.length === 1, 'Back of ID is required.'),
  passportPhoto: z.any().refine((files) => files?.length === 1, 'A passport photo is required.'),
  nin: z.string().length(11, 'NIN must be 11 digits.').regex(/^\d+$/, "NIN must only contain digits."),
});

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

export default function KycPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [provider, setProvider] = useState<CurrencyExchangeAgent | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof kycFormSchema>>({
    resolver: zodResolver(kycFormSchema),
    defaultValues: { nin: '' },
  });
  const { register } = form;

  useEffect(() => {
    if (!authLoading && user) {
      fetchProviderDataByUid(user.uid).then(({ providerData, type }) => {
        if (type === 'currency-exchange') {
          setProvider(providerData);
        } else {
          toast({ variant: 'destructive', title: 'Access Denied', description: 'This page is for Currency Exchange agents.' });
          router.push('/profile');
        }
        setLoadingData(false);
      });
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router, toast]);

  async function onSubmit(values: z.infer<typeof kycFormSchema>) {
    if (!provider) return;
    setIsSubmitting(true);
    toast({ title: 'Submitting KYC...', description: 'Uploading documents, please wait.' });

    try {
        const [idCardFrontUrl, idCardBackUrl, passportPhotoUrl] = await Promise.all([
            uploadToCloudinary(values.idCardFront[0]),
            uploadToCloudinary(values.idCardBack[0]),
            uploadToCloudinary(values.passportPhoto[0])
        ]);

        const providerRef = doc(db, 'currencyExchangeAgents', provider.id);
        await updateDoc(providerRef, {
            idCardFront: idCardFrontUrl,
            idCardBack: idCardBackUrl,
            passportPhoto: passportPhotoUrl,
            nin: values.nin,
            kycStatus: 'pending'
        });

        toast({ title: 'KYC Submitted!', description: 'Your documents are now under review.' });
        router.push(`/currency-exchange/${provider.id}`);

    } catch (error: any) {
        console.error("KYC Submission Error:", error);
        toast({ variant: 'destructive', title: 'Submission Failed', description: error.message || 'Could not upload documents.' });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (authLoading || loadingData) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (!provider) {
      return null;
  }
  
  if (provider.kycStatus === 'verified') {
    return (
      <div className="flex justify-center items-center py-12">
        <Card className="w-full max-w-lg shadow-xl text-center">
          <CardHeader>
            <div className="mx-auto bg-green-500 text-white rounded-full h-20 w-20 flex items-center justify-center">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <CardTitle className="mt-4 text-3xl font-bold font-headline">KYC Verified</CardTitle>
            <CardDescription>Your account has been successfully verified. No further action is needed.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full h-20 w-20 flex items-center justify-center">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <CardTitle className="mt-4 text-3xl font-bold font-headline">KYC Verification</CardTitle>
          <CardDescription>
            {provider.kycStatus === 'rejected' && (
                <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md my-4">
                    <AlertTriangle className="inline-block mr-2 h-4 w-4"/>
                    Your previous submission was rejected. Please review the requirements and submit again.
                </div>
            )}
            Please submit the required documents to verify your identity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="idCardFront"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>ID Card (Front)</FormLabel>
                            <FormDescription>National ID, Voter's Card, or Driver's License.</FormDescription>
                            <FormControl>
                                <Input type="file" accept="image/*" {...register("idCardFront")} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="idCardBack"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>ID Card (Back)</FormLabel>
                            <FormControl>
                                <Input type="file" accept="image/*" {...register("idCardBack")} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="passportPhoto"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Passport Photograph</FormLabel>
                             <FormDescription>A clear, recent headshot.</FormDescription>
                            <FormControl>
                                <Input type="file" accept="image/*" {...register("passportPhoto")} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="nin"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>National Identification Number (NIN)</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter your 11-digit NIN" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit for Review'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
