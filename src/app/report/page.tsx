
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { fetchUserByUid } from '@/lib/data';


const formSchema = z.object({
  fullName: z.string().min(2, {
    message: 'Your name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  phoneNumber: z.string().min(10, {
    message: 'Please enter a valid phone number.',
  }),
  vendorName: z.string().min(2, {
    message: 'Vendor name is required.',
  }),
  report: z.string().min(20, {
    message: 'Please provide a detailed report (at least 20 characters).',
  }),
});

export default function ReportPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDataPrefilled, setIsDataPrefilled] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      vendorName: '',
      report: '',
    },
  });
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast({
            variant: 'destructive',
            title: "Authentication required",
            description: "You must be logged in to report a vendor."
        });
        router.push('/login');
      } else {
        const getUserData = async () => {
            const userData = await fetchUserByUid(user.uid);
            if (userData) {
                form.reset({
                    fullName: userData.fullName || '',
                    email: userData.email || '',
                    // Keep other fields as they are unless they should also be pre-filled
                    phoneNumber: form.getValues('phoneNumber'),
                    vendorName: form.getValues('vendorName'),
                    report: form.getValues('report'),
                });
            }
            setIsDataPrefilled(true);
        };
        getUserData();
      }
    }
  }, [user, loading, router, toast, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    const recipientEmail = 'elitehubng@gmail.com';
    const subject = `Vendor Report: ${values.vendorName}`;
    const body = `
      A new vendor report has been submitted.
      
      Reporter Information:
      ---------------------
      Full Name: ${values.fullName}
      Email: ${values.email}
      Phone Number: ${values.phoneNumber}

      Report Details:
      ---------------
      Vendor Name: ${values.vendorName}
      
      Report:
      ${values.report}
    `;

    // Construct the mailto link
    const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open the user's default email client
    window.location.href = mailtoLink;

    toast({
        title: 'Redirecting to Email Client',
        description: 'Please complete sending the report from your email app.',
    });

    // Reset form after a short delay
    setTimeout(() => {
        form.reset();
        setIsSubmitting(false);
    }, 1500)
  }
  
  if (loading || !isDataPrefilled) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
            <div className="mx-auto bg-destructive text-destructive-foreground rounded-full h-20 w-20 flex items-center justify-center">
                <AlertTriangle className="h-10 w-10" />
            </div>
            <CardTitle className="mt-4 text-3xl font-bold font-headline">Report a Vendor</CardTitle>
            <CardDescription>
                If you've had a negative experience with a vendor, please let us know. Your feedback helps keep our marketplace safe and trustworthy.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Your Full Name</FormLabel>
                        <FormControl>
                            <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Your Email Address</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Your Phone Number</FormLabel>
                        <FormControl>
                            <Input placeholder="(123) 456-7890" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="vendorName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Vendor's Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Artisan Goods Co." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

              <FormField
                control={form.control}
                name="report"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Report</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Please describe the issue in detail. Include dates, product names, and any other relevant information." rows={6} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                    </>
                ) : (
                    "Submit Report"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
