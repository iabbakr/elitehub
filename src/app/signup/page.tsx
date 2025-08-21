
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, User, Package, Wrench, Scale, Truck, ArrowRightLeft } from 'lucide-react';

const registrationOptions = [
    {
        icon: User,
        title: 'Buyer Account',
        description: 'For shopping, favoriting items, and contacting vendors.',
        href: '/signup-user',
        cta: 'Continue as a Buyer'
    },
    {
        icon: Package,
        title: 'Vendor Account',
        description: 'For selling physical or digital products on the marketplace.',
        href: '/register',
        cta: 'Register as a Vendor'
    },
    {
        icon: Wrench,
        title: 'Service Provider',
        description: 'Offer professional, digital, or home repair services.',
        href: '/register-service',
        cta: 'Register as a Provider'
    },
    {
        icon: Scale,
        title: 'Lawyer',
        description: 'Register as a legal professional to offer your services.',
        href: '/register-lawyer',
        cta: 'Register as a Lawyer'
    },
     {
        icon: Truck,
        title: 'Logistics Partner',
        description: 'Provide delivery, dispatch, or flight/train logistics.',
        href: '/register-logistics',
        cta: 'Register as a Partner'
    },
    {
        icon: ArrowRightLeft,
        title: 'Currency Exchange Agent',
        description: 'Offer fiat and crypto exchange services.',
        href: '/register-currency-exchange',
        cta: 'Register as an Agent'
    }
];


export default function SignupHubPage() {
  return (
    <div className="container mx-auto py-12 max-w-4xl">
        <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground">
                Join EliteHub
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                Choose the account type that's right for you. You can always become a provider later.
            </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {registrationOptions.map((option) => (
                <Card key={option.title} className="flex flex-col text-center hover:shadow-xl transition-shadow">
                    <CardHeader className="items-center">
                        <div className="flex-shrink-0 bg-primary/10 text-primary rounded-full h-16 w-16 flex items-center justify-center">
                            <option.icon className="h-8 w-8" />
                        </div>
                        <CardTitle className="mt-4">{option.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                    </CardContent>
                    <div className="p-6 pt-0">
                        <Link href={option.href} passHref>
                            <Button className="w-full">
                                {option.cta} <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </Card>
            ))}
        </div>
         <div className="mt-8 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </div>
    </div>
  );
}
