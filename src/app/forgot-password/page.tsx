
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, MailQuestion } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, values.email);
      setEmailSent(true);
      toast({
        title: 'Password Reset Email Sent',
        description: `If an account exists for ${values.email}, a password reset link has been sent.`,
      });
    } catch (error: any) {
      console.error("Password Reset Error:", error);
      // We show a generic success message even on error to prevent email enumeration
      setEmailSent(true);
       toast({
        title: 'Password Reset Email Sent',
        description: `If an account exists for ${values.email}, a password reset link has been sent.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
             <div className="mx-auto bg-primary text-primary-foreground rounded-full h-20 w-20 flex items-center justify-center">
                <MailQuestion className="h-10 w-10" />
            </div>
          <CardTitle className="mt-4 text-3xl font-bold font-headline">Forgot Your Password?</CardTitle>
          <CardDescription>
            {emailSent 
              ? "Please check your inbox (and spam folder) for the password reset link."
              : "No problem. Enter your email address below and we'll send you a link to reset it."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="text-center">
                <Button asChild>
                    <Link href="/login">Back to Login</Link>
                </Button>
            </div>
          ) : (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                </Button>
                </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
