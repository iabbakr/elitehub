

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { nigerianStates, type Vendor, createProfileUpdateRequest } from '@/lib/data';
import { useState, useMemo } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { differenceInDays } from 'date-fns';

const profileFormSchema = z.object({
  name: z.string().min(2, "Vendor name must be at least 2 characters."),
  fullname: z.string().min(2, "Full name is required."),
  rcNumber: z.string().optional(),
  phoneNumber: z.string().min(10, "Please enter a valid phone number."),
  whatsappNumber: z.string().optional(),
  address: z.string().min(10, "Please enter a valid address."),
  city: z.string().min(2, "City is required."),
  location: z.string({ required_error: "Please select a location." }),
  businessDescription: z.string().min(10, "Description must be at least 10 characters."),
});

interface VendorProfileFormProps {
    vendor: Vendor;
    onSuccess: () => void;
    onCancel: () => void;
}

export function VendorProfileForm({ vendor, onSuccess, onCancel }: VendorProfileFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: vendor.name || '',
      fullname: vendor.fullname || '',
      rcNumber: vendor.rcNumber || '',
      phoneNumber: vendor.phoneNumber || '',
      whatsappNumber: vendor.whatsappNumber || '',
      address: vendor.address || '',
      city: vendor.city || '',
      location: vendor.location || '',
      businessDescription: vendor.businessDescription || '',
    },
  });
  
  const canRequestUpdate = useMemo(() => {
    if (vendor.profileUpdateStatus === 'pending') return false;
    if (!vendor.lastProfileUpdateRequest) return true;
    const lastRequestDate = new Date(vendor.lastProfileUpdateRequest.seconds * 1000);
    return differenceInDays(new Date(), lastRequestDate) >= 30;
  }, [vendor.profileUpdateStatus, vendor.lastProfileUpdateRequest]);

  const daysUntilNextUpdate = useMemo(() => {
    if (!vendor.lastProfileUpdateRequest) return 0;
    const lastRequestDate = new Date(vendor.lastProfileUpdateRequest.seconds * 1000);
    const daysSince = differenceInDays(new Date(), lastRequestDate);
    return 30 - daysSince;
  }, [vendor.lastProfileUpdateRequest]);

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!canRequestUpdate) {
        toast({ variant: 'destructive', title: "Update Limit Reached", description: "You can only request a profile update once every 30 days." });
        return;
    }
    setIsSubmitting(true);
    toast({ title: 'Submitting Update Request...', description: 'Please wait.' });

    try {
      await createProfileUpdateRequest('vendor', vendor.id, vendor.uid!, values);
      toast({ title: 'Update Request Submitted!', description: 'Your profile changes are now pending admin approval.' });
      onSuccess();
    } catch (error: any) {
      console.error("Error submitting update request:", error);
      toast({ variant: 'destructive', title: "Error", description: "Failed to submit update request. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Your Profile</DialogTitle>
        <DialogDescription>
          Submit your desired profile changes for admin review. You can request an update once every 30 days.
        </DialogDescription>
      </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow min-h-0">
             <ScrollArea className="flex-grow px-6 py-4">
              <div className="space-y-4">
                {vendor.profileUpdateStatus === 'pending' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-md flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin"/>
                    <span>Your previous update request is currently under review.</span>
                  </div>
                )}
                {vendor.profileUpdateStatus === 'approved' && (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-md flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-4 w-4"/>
                    <span>Your last profile update was approved.</span>
                  </div>
                )}
                {!canRequestUpdate && vendor.profileUpdateStatus !== 'pending' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-md flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4"/>
                    <span>You must wait {daysUntilNextUpdate} more day(s) to request another update.</span>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Vendor Name</FormLabel><FormControl><Input placeholder="e.g. Artisan Goods Co." {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="rcNumber" render={({ field }) => ( <FormItem><FormLabel>RC Number (Optional)</FormLabel><FormControl><Input placeholder="Enter your RC Number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <FormField control={form.control} name="fullname" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="phoneNumber" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="(123) 456-7890" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="whatsappNumber" render={({ field }) => ( <FormItem><FormLabel>WhatsApp Number (Optional)</FormLabel><FormControl><Input placeholder="e.g. 2348012345678" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Business Address</FormLabel><FormControl><Input placeholder="123 Main Street" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g. Ikeja" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="location" render={({ field }) => ( <FormItem><FormLabel>State</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select your state" /></SelectTrigger><SelectContent>{nigerianStates.map((state) => (<SelectItem key={state} value={state}>{state}</SelectItem>))}</SelectContent></Select></FormControl><FormMessage /></FormItem> )} />
                </div>
                <FormField control={form.control} name="businessDescription" render={({ field }) => ( <FormItem><FormLabel>Business Description</FormLabel><FormControl><Textarea placeholder="Describe your business and products." {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
             </ScrollArea>
            <DialogFooter className="flex-shrink-0">
              <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || !canRequestUpdate}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Submitting...' : 'Submit for Review'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
    </>
  );
}
