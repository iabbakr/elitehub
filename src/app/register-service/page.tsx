
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
import { Loader2, Wrench } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { nigerianStates, fetchUserByUid, checkIfUserIsAlreadyProvider, serviceCategories, serviceSubCategories, checkIfValueExists } from '@/lib/data';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const formSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  email: z.string().email("A valid email is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  phoneNumber: z.string().min(10, "Please enter a valid phone number."),
  whatsappNumber: z.string().optional(),
  businessName: z.string().min(2, "Business name is required."),
  rcNumber: z.string().optional(),
  bio: z.string().min(10, "Bio is required."),
  city: z.string().min(2, "City is required."),
  location: z.string({ required_error: "Please select a location." }),
  serviceCategory: z.string({ required_error: "Please select a service category." }),
  serviceType: z.string({ required_error: "Please select a specific service." }),
  operatesOnline: z.boolean().default(false),
  hasPhysicalLocation: z.boolean().default(false),
  address: z.string().optional(),
  terms: z.boolean().refine(value => value === true, {
    message: 'You must agree to the terms and conditions.',
  }),
}).refine(data => data.operatesOnline || data.hasPhysicalLocation, {
    message: "You must select at least one operation mode (Online or Physical Location).",
    path: ["operatesOnline"], 
}).refine(data => !data.hasPhysicalLocation || (data.hasPhysicalLocation && data.address), {
    message: "Address is required if you have a physical location.",
    path: ["address"],
});


export default function RegisterServicePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      phoneNumber: '',
      whatsappNumber: '',
      businessName: '',
      rcNumber: '',
      bio: '',
      city: '',
      operatesOnline: false,
      hasPhysicalLocation: false,
      address: '',
      terms: false,
    },
  });

  const selectedCategory = form.watch('serviceCategory');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
       const collectionsToCheck = ['serviceProviders', 'serviceProviderApplications'];
       const checks = [
          { field: 'businessName', value: values.businessName, label: 'Business Name' },
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

      // Create Firebase Auth user first
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

       // Create the user document in 'users' collection
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: values.fullName,
        email: user.email,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });

      await addDoc(collection(db, "serviceProviderApplications"), {
        uid: user.uid,
        ...values,
        status: 'pending',
        submittedAt: serverTimestamp(),
      });

      toast({
        title: 'Application Submitted!',
        description: 'Your application is now under review. You have been logged in.',
      });
      form.reset();
      router.push('/profile');

    } catch (error: any) {
      console.error("Application Submission Error:", error);
       let errorMessage = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already in use. Please log in or use a different email.";
      }
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="items-center text-center">
            <div className="mx-auto bg-primary text-primary-foreground rounded-full h-20 w-20 flex items-center justify-center">
                <Wrench className="h-10 w-10" />
            </div>
          <CardTitle className="text-3xl font-bold font-headline">Service Provider Registration</CardTitle>
          <CardDescription>
            Join our network of trusted professionals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField control={form.control} name="fullName" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="phoneNumber" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="(123) 456-7890" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="whatsappNumber" render={({ field }) => ( <FormItem><FormLabel>WhatsApp Number (Optional)</FormLabel><FormControl><Input placeholder="e.g. 2348012345678" {...field} /></FormControl><FormDescription>Start with country code.</FormDescription><FormMessage /></FormItem> )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="businessName" render={({ field }) => ( <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input placeholder="e.g. JD Services" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="rcNumber" render={({ field }) => ( <FormItem><FormLabel>RC Number (Optional)</FormLabel><FormControl><Input placeholder="Enter RC number" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="serviceCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Category</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your main category" />
                            </SelectTrigger>
                          <SelectContent>
                            {serviceCategories.map((cat) => (
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
                 <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specific Service</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder={selectedCategory ? "Select your service" : "Select category first"} />
                            </SelectTrigger>
                          <SelectContent>
                            {(serviceSubCategories[selectedCategory] || []).map((subCat) => (
                              <SelectItem key={subCat} value={subCat}>
                                {subCat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <FormField control={form.control} name="bio" render={({ field }) => ( <FormItem><FormLabel>Bio / Service Description</FormLabel><FormControl><Textarea placeholder="Describe your services, experience, and what makes you unique..." {...field} /></FormControl><FormMessage /></FormItem> )} />
              
                <FormItem>
                    <FormLabel>Operation Mode</FormLabel>
                    <FormDescription>Where do you provide your services?</FormDescription>
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
