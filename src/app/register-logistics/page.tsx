

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
import { Loader2, Truck } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { nigerianStates, fetchUserByUid, checkIfUserIsAlreadyProvider, logisticsCategories, checkIfValueExists } from '@/lib/data';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const formSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  email: z.string().email("A valid email is required."),
  phoneNumber: z.string().min(10, "Please enter a valid phone number."),
  whatsappNumber: z.string().optional(),
  name: z.string().min(2, "Company name must be at least 2 characters."),
  address: z.string().min(10, "Please enter a valid address."),
  city: z.string().min(2, "City is required."),
  location: z.string({ required_error: "Please select a location." }),
  rcNumber: z.string().optional(),
  bio: z.string().min(10, "Bio must be at least 10 characters."),
  category: z.string({ required_error: "Please select a service category." }),
  terms: z.boolean().refine(value => value === true, {
    message: 'You must agree to the terms and conditions.',
  }),
});

export default function RegisterLogisticsPage() {
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
      name: '',
      address: '',
      city: '',
      rcNumber: '',
      bio: '',
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
      const collectionsToCheck = ['logisticsCompanies', 'logisticsApplications'];
      const checks = [
          { field: 'name', value: values.name, label: 'Company Name' },
          { field: 'phoneNumber', value: values.phoneNumber, label: 'Phone Number' },
          { field: 'whatsappNumber', value: values.whatsappNumber, label: 'WhatsApp Number' },
          { field: 'rcNumber', value: values.rcNumber, label: 'RC Number' }
      ];

      for (const check of checks) {
          if (check.value && await checkIfValueExists(collectionsToCheck, check.field, check.value)) {
              toast({ variant: 'destructive', title: 'Duplicate Information', description: `${check.label} "${check.value}" is already in use.` });
              setIsSubmitting(false);
              return;
          }
      }
      
      await addDoc(collection(db, "logisticsApplications"), {
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
                <Truck className="h-10 w-10" />
            </div>
          <CardTitle className="text-3xl font-bold font-headline">Logistics Partner Registration</CardTitle>
          <CardDescription>
            Join our network of trusted logistics companies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField control={form.control} name="fullName" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} readOnly /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="phoneNumber" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="(123) 456-7890" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="whatsappNumber" render={({ field }) => ( <FormItem><FormLabel>WhatsApp Number (Optional)</FormLabel><FormControl><Input placeholder="e.g. 2348012345678" {...field} /></FormControl><FormDescription>Start with country code.</FormDescription><FormMessage /></FormItem> )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input placeholder="e.g. Swift Deliveries" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="rcNumber" render={({ field }) => ( <FormItem><FormLabel>RC Number (Optional)</FormLabel><FormControl><Input placeholder="Enter RC number" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logistics Category</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your primary service" />
                            </SelectTrigger>
                          <SelectContent>
                            {logisticsCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.name}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
               <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Business Address</FormLabel><FormControl><Input placeholder="123 Main Street" {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                      <SelectValue placeholder="Select your state of operation" />
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
               <FormField control={form.control} name="bio" render={({ field }) => ( <FormItem><FormLabel>Company Bio</FormLabel><FormControl><Textarea placeholder="Describe your logistics services..." {...field} /></FormControl><FormMessage /></FormItem> )} />
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
