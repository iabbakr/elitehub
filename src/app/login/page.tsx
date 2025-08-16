

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
import { Loader2 } from 'lucide-react';
import { auth, db, googleProvider } from '@/lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.223 0-9.64-3.337-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.589-2.275 4.82-4.253 6.464l6.19 5.238C42.015 36.423 44 30.861 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
);


const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(1, {
    message: 'Password is required.',
  }),
});

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSuccessfulLogin = async (user: any) => {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      // User exists, update last login time
      await updateDoc(userDocRef, { lastLogin: serverTimestamp() });
    } else {
      // New user (likely from Google Sign-In), create their document
      await setDoc(userDocRef, {
        uid: user.uid,
        fullName: user.displayName,
        email: user.email,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
    }

    toast({
      title: 'Login Successful!',
      description: `Welcome back, ${user.displayName || userDoc.data()?.fullName || 'User'}!`,
    });
    router.push('/');
  }

  async function handleGoogleSignIn() {
    setIsGoogleSubmitting(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleSuccessfulLogin(result.user);
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: 'Could not sign in with Google. Please try again.',
      });
    } finally {
      setIsGoogleSubmitting(false);
    }
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const result = await signInWithEmailAndPassword(auth, values.email, values.password);
      await handleSuccessfulLogin(result.user);
    } catch (error: any) {
      console.error("Login Error:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Please try again.";
      }
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your EliteHub account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              <Button type="submit" className="w-full" disabled={isSubmitting || isGoogleSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </Form>

           <div className="relative my-6">
              <Separator />
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
                <span className="bg-card px-2 text-sm text-muted-foreground">OR CONTINUE WITH</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting || isGoogleSubmitting}>
                {isGoogleSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <GoogleIcon />
                )}
                Continue with Google
            </Button>

          <div className="mt-6 text-center text-sm">
            Don't have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
