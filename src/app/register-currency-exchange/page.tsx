

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
import { Loader2, ArrowRightLeft, Eye, EyeOff } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, setDoc, doc, writeBatch } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { nigerianStates, transactionTypes, checkIfEmailExists } from '@/lib/data';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { handleReferralOnSignup } from '@/app/actions/adminActions';

const formSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  email: z.string().email("A valid email is required."),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  phoneNumber: z.string().min(10, "Please enter a valid phone number."),
  whatsappNumber: z.string().optional(),
  businessName: z.string().min(2, "Business name is required."),
  bio: z.string().min(10, "Bio is required."),
  city: z.string().min(2, "City is required."),
  location: z.string({ required_error: "Please select a location." }),
  referralCode: z.string().optional(),
  currenciesAccepted: z.array(z.string()).refine(value => value.some(item => item), {
    message: 'You must select at least one currency type.',
  }),
  transactionTypes: z.array(z.string()).refine(value => value.some(item => item), {
    message: 'You must select at least one transaction type.',
  }),
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
}).refine(data => {
    if (auth.currentUser) return true;
    return data.password === data.confirmPassword;
}, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
}).refine(data => {
    if (auth.currentUser) return true;
    return data.password && data.password.length >= 8;
}, {
    message: "Password must be at least 8 characters.",
    path: ["password"],
});



export default function RegisterCurrencyExchangePage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '', email: '', password: '', confirmPassword: '', phoneNumber: '', whatsappNumber: '', businessName: '',
      bio: '', city: '', currenciesAccepted: [], transactionTypes: [], operatesOnline: false,
      hasPhysicalLocation: false, address: '', terms: false, referralCode: '',
    },
  });

  useEffect(() => {
    if (user) {
      form.setValue('email', user.email || '');
      form.setValue('fullName', user.displayName || '');
    }
  }, [user, form]);
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    let userId = user?.uid;
    try {
      if (!user) {
          if (!values.password) {
                 toast({ variant: 'destructive', title: 'Submission Failed', description: "Password is required for new accounts." });
                 setIsSubmitting(false);
                 return;
          }
        const emailExists = await checkIfEmailExists(values.email);
        if (emailExists) {
            toast({
                variant: 'destructive',
                title: 'Email Already in Use',
                description: 'An account with this email already exists. Please log in first, or use a different email.'
            });
            setIsSubmitting(false);
            return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        userId = userCredential.user.uid;
        
        await updateProfile(userCredential.user, { displayName: values.fullName });

        await handleReferralOnSignup({ 
            newUserUid: userId, 
            newUserFullName: values.fullName, 
            newUserEmail: values.email,
            referralCode: values.referralCode 
        });
      }
      
      const { password, confirmPassword, ...applicationData } = values;

      await addDoc(collection(db, "currencyExchangeApplications"), {
        ...applicationData,
        uid: userId,
        status: 'pending',
        submittedAt: serverTimestamp(),
      });

      toast({
        title: 'Application Submitted!',
        description: 'Your application is now under review. You can now browse the app while you wait.',
      });
      
      if (!user && values.password) {
        await signInWithEmailAndPassword(auth, values.email, values.password);
      }
      
      router.push('/');

    } catch (error: any) {
      console.error("Application Submission Error:", error);
      let errorMessage = 'An unexpected error occurred. Please try again.';
       if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email address is already associated with an account. Please log in first.";
      } else if (error.code === 'permission-denied') {
        errorMessage = 'You do not have permission to perform this action. Please check your login status or contact support.';
      }
      toast({ variant: 'destructive', title: 'Submission Failed', description: errorMessage, });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="items-center text-center">
            <div className="mx-auto bg-primary text-primary-foreground rounded-full h-20 w-20 flex items-center justify-center">
                <ArrowRightLeft className="h-10 w-10" />
            </div>
          <CardTitle className="text-3xl font-bold font-headline">Currency Exchange Agent Registration</CardTitle>
          <CardDescription>
            {user ? "You are already signed in. Fill out the form below to apply." : "Join our network of trusted exchange agents."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField control={form.control} name="fullName" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} disabled={!!user} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              {!user && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Password</FormLabel><FormControl><div className="relative"><Input type={showPassword ? 'text' : 'password'} placeholder="********" {...field} /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowPassword(prev => !prev)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="confirmPassword" render={({ field }) => ( <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><div className="relative"><Input type={showConfirmPassword ? 'text' : 'password'} placeholder="********" {...field} /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowConfirmPassword(prev => !prev)}>{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div></FormControl><FormMessage /></FormItem>)} />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="phoneNumber" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="(123) 456-7890" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="whatsappNumber" render={({ field }) => ( <FormItem><FormLabel>WhatsApp Number (Optional)</FormLabel><FormControl><Input placeholder="e.g. 2348012345678" {...field} /></FormControl><FormDescription>Start with country code.</FormDescription><FormMessage /></FormItem> )} />
              </div>
                <FormField control={form.control} name="businessName" render={({ field }) => ( <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input placeholder="e.g. JD Exchange" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="bio" render={({ field }) => ( <FormItem><FormLabel>Bio / Service Description</FormLabel><FormControl><Textarea placeholder="Describe your services, rates, and what makes you unique..." {...field} /></FormControl><FormMessage /></FormItem> )} />
              
                <FormItem>
                    <FormLabel>Operation Mode</FormLabel>
                    <FormDescription>Where do you provide your services?</FormDescription>
                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <FormField control={form.control} name="operatesOnline" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Online / Remotely</FormLabel></div></FormItem>)}/>
                        <FormField control={form.control} name="hasPhysicalLocation" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Physical Location / In-person</FormLabel></div></FormItem>)}/>
                    </div>
                     <FormMessage>{form.formState.errors.operatesOnline?.message}</FormMessage>
                </FormItem>

               <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Business Address (if applicable)</FormLabel><FormControl><Input placeholder="123 Main Street" {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g. Ikeja" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>State</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select your state of operation" /></SelectTrigger></FormControl><SelectContent>{nigerianStates.map((state) => (<SelectItem key={state} value={state}>{state}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
                </div>
                 <FormField control={form.control} name="referralCode" render={({ field }) => ( <FormItem><FormLabel>Referral Code (Optional)</FormLabel><FormControl><Input placeholder="Enter code from an existing user" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="currenciesAccepted"
                      render={() => (
                        <FormItem>
                            <FormLabel>Accepted Currencies</FormLabel>
                            <div className="flex gap-4 pt-2">
                                {['Fiat', 'Crypto'].map(item => (
                                   <FormField key={item} control={form.control} name="currenciesAccepted" render={({ field }) => (<FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => { return checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter((value) => value !== item)) }} /></FormControl><FormLabel className="font-normal">{item}</FormLabel></FormItem>)}/>
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="transactionTypes"
                      render={() => (
                        <FormItem>
                            <FormLabel>Transaction Methods</FormLabel>
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                {transactionTypes.map(item => (
                                   <FormField key={item} control={form.control} name="transactionTypes" render={({ field }) => (<FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => { return checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter((value) => value !== item)) }} /></FormControl><FormLabel className="font-normal">{item}</FormLabel></FormItem>)}/>
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 <FormField control={form.control} name="terms" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>I agree to Elitehub’s <Link href="/terms" className="text-primary hover:underline" target="_blank">Terms and Conditions</Link> and <Link href="/privacy" className="text-primary hover:underline" target="_blank">Privacy Policy</Link>.</FormLabel><FormMessage /></div></FormItem>)}/>
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
