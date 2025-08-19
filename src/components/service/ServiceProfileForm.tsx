

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
import { nigerianStates, type ServiceProvider } from '@/lib/data';
import { useState } from 'react';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';

const profileFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  businessName: z.string().min(2, "Business name is required."),
  phoneNumber: z.string().min(10, "Please enter a valid phone number."),
  whatsappNumber: z.string().optional(),
  bio: z.string().min(10, "Bio is required."),
  city: z.string().min(2, "City is required."),
  location: z.string({ required_error: "Please select a location." }),
  operatesOnline: z.boolean().default(false),
  hasPhysicalLocation: z.boolean().default(false),
  address: z.string().optional(),
}).refine(data => data.operatesOnline || data.hasPhysicalLocation, {
    message: "You must select at least one operation mode (Online or Physical Location).",
    path: ["operatesOnline"], 
}).refine(data => !data.hasPhysicalLocation || (data.hasPhysicalLocation && data.address), {
    message: "Address is required if you have a physical location.",
    path: ["address"],
});


interface ServiceProfileFormProps {
    provider: ServiceProvider;
    onSuccess: () => void;
    onCancel: () => void;
}

export function ServiceProfileForm({ provider, onSuccess, onCancel }: ServiceProfileFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: provider.fullName || '',
      businessName: provider.businessName || '',
      phoneNumber: provider.phoneNumber || '',
      whatsappNumber: provider.whatsappNumber || '',
      bio: provider.bio || '',
      city: provider.city || '',
      location: provider.location || '',
      operatesOnline: provider.operatesOnline || false,
      hasPhysicalLocation: provider.hasPhysicalLocation || false,
      address: provider.address || '',
    },
  });

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    setIsSubmitting(true);
    toast({ title: 'Updating Profile...', description: 'Please wait.' });

    try {
      const providerDocRef = doc(db, 'serviceProviders', provider.id);
      const updateData: Partial<ServiceProvider> = { ...values };

      if (values.whatsappNumber && values.whatsappNumber !== provider.whatsappNumber) {
        updateData.whatsappNumberLastUpdated = serverTimestamp();
      }

      await updateDoc(providerDocRef, updateData);
      
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
        <DialogTitle>Edit Your Service Profile</DialogTitle>
        <DialogDescription>
          Update your public information. Click save when you're done.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow min-h-0">
          <ScrollArea className="flex-grow px-6 py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="fullName" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="businessName" render={({ field }) => ( <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input placeholder="e.g. JD Services" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="phoneNumber" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="(123) 456-7890" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="whatsappNumber" render={({ field }) => ( <FormItem><FormLabel>WhatsApp Number (Optional)</FormLabel><FormControl><Input placeholder="e.g. 2348012345678" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>

              <FormField control={form.control} name="bio" render={({ field }) => ( <FormItem><FormLabel>Bio / Service Description</FormLabel><FormControl><Textarea placeholder="Describe your services, experience, and what makes you unique..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                  
              <FormItem>
                  <FormLabel>Operation Mode</FormLabel>
                  <div className="flex flex-col sm:flex-row gap-4 pt-2">
                      <FormField
                          control={form.control}
                          name="operatesOnline"
                          render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Online / Remotely</FormLabel></div></FormItem>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name="hasPhysicalLocation"
                          render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Physical Location / In-person</FormLabel></div></FormItem>
                          )}
                      />
                  </div>
                    <FormMessage>{form.formState.errors.operatesOnline?.message}</FormMessage>
              </FormItem>

              <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Business Address (if applicable)</FormLabel><FormControl><Input placeholder="123 Main Street" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g. Ikeja" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your state" />
                                </SelectTrigger>
                            </FormControl>
                          <SelectContent>
                            {nigerianStates.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="flex-shrink-0">
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
