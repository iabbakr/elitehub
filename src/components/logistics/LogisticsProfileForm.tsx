
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
import { Loader2 } from 'lucide-react';
import { nigerianStates, type LogisticsCompany } from '@/lib/data';
import { useState } from 'react';

const profileFormSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters."),
  phoneNumber: z.string().min(10, "Please enter a valid phone number."),
  whatsappNumber: z.string().optional(),
  address: z.string().min(10, "Please enter a valid address."),
  city: z.string().min(2, "City is required."),
  location: z.string({ required_error: "Please select a location." }),
  bio: z.string().min(10, "Description must be at least 10 characters."),
  rcNumber: z.string().optional(),
});

interface LogisticsProfileFormProps {
    company: LogisticsCompany;
    onSuccess: () => void;
    onCancel: () => void;
}

export function LogisticsProfileForm({ company, onSuccess, onCancel }: LogisticsProfileFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: company.name || '',
      phoneNumber: company.phoneNumber || '',
      whatsappNumber: company.whatsappNumber || '',
      address: company.address || '',
      city: company.city || '',
      location: company.location || '',
      bio: company.bio || '',
      rcNumber: company.rcNumber || '',
    },
  });

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    setIsSubmitting(true);
    toast({ title: 'Updating Profile...', description: 'Please wait.' });

    try {
      const companyDocRef = doc(db, 'logisticsCompanies', company.id);
      const updateData: Partial<LogisticsCompany> = { ...values };

      if (values.whatsappNumber && values.whatsappNumber !== company.whatsappNumber) {
        updateData.whatsappNumberLastUpdated = serverTimestamp();
      }

      await updateDoc(companyDocRef, updateData);
      
      toast({ title: 'Profile Updated!', description: 'Your information has been saved.' });
      onSuccess();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({ variant: 'destructive', title: "Error", description: "Failed to update profile. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Your Logistics Profile</DialogTitle>
        <DialogDescription>
          Update your public information. Click save when you're done.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-6">
          <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input placeholder="e.g. Swift Deliveries" {...field} /></FormControl><FormMessage /></FormItem> )} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="phoneNumber" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="(123) 456-7890" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="whatsappNumber" render={({ field }) => ( <FormItem><FormLabel>WhatsApp Number (Optional)</FormLabel><FormControl><Input placeholder="e.g. 2348012345678" {...field} /></FormControl><FormMessage /></FormItem> )} />
          </div>
          <FormField control={form.control} name="rcNumber" render={({ field }) => ( <FormItem><FormLabel>RC Number (Optional)</FormLabel><FormControl><Input placeholder="Enter RC Number" {...field} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Business Address</FormLabel><FormControl><Input placeholder="123 Main Street" {...field} /></FormControl><FormMessage /></FormItem> )} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g. Ikeja" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="location" render={({ field }) => ( <FormItem><FormLabel>State</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select your state" /></SelectTrigger><SelectContent>{nigerianStates.map((state) => (<SelectItem key={state} value={state}>{state}</SelectItem>))}</SelectContent></Select></FormControl><FormMessage /></FormItem> )} />
          </div>
          <FormField control={form.control} name="bio" render={({ field }) => ( <FormItem><FormLabel>Company Bio</FormLabel><FormControl><Textarea placeholder="Describe your logistics services." {...field} /></FormControl><FormMessage /></FormItem> )} />
          
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}

