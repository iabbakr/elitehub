

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
import { nigerianStates, practiceAreas, type Lawyer } from '@/lib/data';
import { useState } from 'react';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';

const profileFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  phoneNumber: z.string().min(10, "Please enter a valid phone number."),
  whatsappNumber: z.string().optional(),
  tagline: z.string().min(10, "Tagline must be at least 10 characters.").max(100, "Tagline cannot exceed 100 characters."),
  bio: z.string().min(50, "Bio must be at least 50 characters."),
  city: z.string().min(2, "City is required."),
  location: z.string({ required_error: "Please select a location." }),
  practiceAreas: z.array(z.string()).refine(value => value.some(item => item), {
    message: 'You have to select at least one practice area.',
  }),
});

interface LawyerProfileFormProps {
    lawyer: Lawyer;
    onSuccess: () => void;
    onCancel: () => void;
}

export function LawyerProfileForm({ lawyer, onSuccess, onCancel }: LawyerProfileFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: lawyer.fullName || '',
      phoneNumber: lawyer.phoneNumber || '',
      whatsappNumber: lawyer.whatsappNumber || '',
      tagline: lawyer.tagline || '',
      bio: lawyer.bio || '',
      city: lawyer.city || '',
      location: lawyer.location || '',
      practiceAreas: lawyer.practiceAreas || [],
    },
  });

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    setIsSubmitting(true);
    toast({ title: 'Updating Profile...', description: 'Please wait.' });

    try {
      const lawyerDocRef = doc(db, 'lawyers', lawyer.id);
      const updateData: Partial<Lawyer> = { ...values };

      if (values.whatsappNumber && values.whatsappNumber !== lawyer.whatsappNumber) {
        updateData.whatsappNumberLastUpdated = serverTimestamp();
      }

      await updateDoc(lawyerDocRef, updateData);
      
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
        <DialogTitle>Edit Your Professional Profile</DialogTitle>
        <DialogDescription>
          Update your public information. Click save when you're done.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow min-h-0">
          <ScrollArea className="flex-grow px-6 py-4">
            <div className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe, Esq." {...field} /></FormControl><FormMessage /></FormItem> )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="phoneNumber" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="(123) 456-7890" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="whatsappNumber" render={({ field }) => ( <FormItem><FormLabel>WhatsApp Number (Optional)</FormLabel><FormControl><Input placeholder="e.g. 2348012345678" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <FormField control={form.control} name="tagline" render={({ field }) => ( <FormItem><FormLabel>Professional Tagline</FormLabel><FormControl><Input placeholder="e.g. Your Trusted Partner in Corporate Law" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g. Ikeja" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State of Practice</FormLabel>
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
              <FormField
                control={form.control}
                name="practiceAreas"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Practice Areas</FormLabel>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {practiceAreas.map((item) => (
                          <FormField
                          key={item}
                          control={form.control}
                          name="practiceAreas"
                          render={({ field }) => (
                            <FormItem
                              key={item}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), item])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {item}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="bio" render={({ field }) => ( <FormItem><FormLabel>Professional Bio</FormLabel><FormControl><Textarea placeholder="Describe your legal background and expertise..." rows={5} {...field} /></FormControl><FormMessage /></FormItem> )} />
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
