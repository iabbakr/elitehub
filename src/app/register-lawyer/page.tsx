

'use client';

import { useForm, Controller } from 'react-hook-form';
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
import { Loader2, Scale } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { nigerianStates, fetchUserByUid, checkIfUserIsAlreadyProvider, practiceAreas, checkIfValueExists } from '@/lib/data';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const formSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  email: z.string().email("A valid email is required."),
  phoneNumber: z.string().min(10, "Please enter a valid phone number."),
  whatsappNumber: z.string().optional(),
  scn: z.string().min(2, "Supreme Court Number (SCN) is required."),
  tagline: z.string().min(10, "Tagline must be at least 10 characters.").max(100, "Tagline cannot exceed 100 characters."),
  bio: z.string().min(50, "Bio must be at least 50 characters."),
  city: z.string().min(2, "City is required."),
  location: z.string({ required_error: "Please select a location." }),
  yearsOfExperience: z.coerce.number().min(0, "Years of experience cannot be negative."),
  practiceAreas: z.array(z.string()).refine(value => value.some(item => item), {
    message: 'You have to select at least one practice area.',
  }).refine(value => value.length <= 6, {
    message: 'You can select a maximum of 6 practice areas.',
  }),
  terms: z.boolean().refine(value => value === true, {
    message: 'You must agree to the terms and conditions.',
  }),
});

export default function RegisterLawyerPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      whatsappNumber: '',
      scn: '',
      tagline: '',
      bio: '',
      city: '',
      yearsOfExperience: 0,
      practiceAreas: [],
      terms: false,
    },
  });

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast({
          variant: 'destructive',
          title: "Authentication required",
          description: "You must be logged in to apply."
        });
        router.push('/login');
        return;
      }
      
      const checkProviderStatus = async () => {
        const isProvider = await checkIfUserIsAlreadyProvider(user.uid);
        if (isProvider) {
          toast({
            variant: 'destructive',
            title: "Registration Unavailable",
            description: "You already have a provider role."
          });
          router.push('/profile');
        } else {
            const userData = await fetchUserByUid(user.uid);
            if (userData) {
                form.reset({
                  ...form.getValues(),
                  fullName: userData.fullName || '',
                  email: userData.email || '',
                });
            }
            setIsCheckingUser(false);
        }
      };

      checkProviderStatus();
    }
  }, [user, loading, router, toast, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const collectionsToCheck = ['lawyers', 'lawyerApplications'];
      const checks = [
          { field: 'phoneNumber', value: values.phoneNumber, label: 'Phone Number' },
          { field: 'whatsappNumber', value: values.whatsappNumber, label: 'WhatsApp Number' },
          { field: 'scn', value: values.scn, label: 'SCN' }
      ];

      for (const check of checks) {
          if (check.value && await checkIfValueExists(collectionsToCheck, check.field, check.value)) {
              toast({ variant: 'destructive', title: 'Duplicate Information', description: `${check.label} "${check.value}" is already in use.` });
              setIsSubmitting(false);
              return;
          }
      }

      await addDoc(collection(db, "lawyerApplications"), {
        uid: user.uid,
        ...values,
        status: 'pending',
        submittedAt: serverTimestamp(),
      });

      toast({
        title: 'Application Submitted!',
        description: 'Your application is now under review.',
      });
      form.reset();
      router.push('/profile');

    } catch (error: any) {
      console.error("Application Submission Error:", error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading || isCheckingUser) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="items-center text-center">
            <div className="mx-auto bg-primary text-primary-foreground rounded-full h-20 w-20 flex items-center justify-center">
                <Scale className="h-10 w-10" />
            </div>
          <CardTitle className="text-3xl font-bold font-headline">Legal Professional Registration</CardTitle>
          <CardDescription>
            Join our network of trusted legal experts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField control={form.control} name="fullName" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe, Esq." {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} readOnly /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="phoneNumber" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="(123) 456-7890" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="whatsappNumber" render={({ field }) => ( <FormItem><FormLabel>WhatsApp Number (Optional)</FormLabel><FormControl><Input placeholder="e.g. 2348012345678" {...field} /></FormControl><FormDescription>Start with country code.</FormDescription><FormMessage /></FormItem> )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="scn" render={({ field }) => ( <FormItem><FormLabel>SCN</FormLabel><FormControl><Input placeholder="Enter your SCN" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="yearsOfExperience" render={({ field }) => ( <FormItem><FormLabel>Years of Experience</FormLabel><FormControl><Input type="number" placeholder="e.g. 10" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
               <FormField control={form.control} name="tagline" render={({ field }) => ( <FormItem><FormLabel>Professional Tagline</FormLabel><FormControl><Input placeholder="e.g. Your Trusted Partner in Corporate Law" {...field} /></FormControl><FormMessage /></FormItem> )} />

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <FormDescription>
                          Select up to 6 areas you specialize in.
                        </FormDescription>
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
                 <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I agree to Elitehub’s <Link href="/terms" className="text-primary hover:underline" target="_blank">Terms and Conditions</Link> and <Link href="/privacy" className="text-primary hover:underline" target="_blank">Privacy Policy</Link>.
                        </FormLabel>
                         <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Submitting...' : 'Apply for Review'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
