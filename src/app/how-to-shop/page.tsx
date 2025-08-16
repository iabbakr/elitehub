

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, UserPlus, Search, Info, Heart, MessageSquare, Lock } from 'lucide-react';
import Link from 'next/link';

const shoppingSteps = [
    {
        icon: UserPlus,
        title: 'Step 1: Create Your Free Account',
        description: "Sign up to unlock all features, including favorites, direct vendor chat, and a seamless checkout experience.",
        cta: 'Create an Account',
        link: '/signup',
    },
    {
        icon: Search,
        title: 'Step 2: Find Your Perfect Item',
        description: "Use our powerful search bar to find specific items, or browse through our diverse categories to discover new products from our trusted vendors.",
        cta: 'Browse All Products',
        link: '/products',
    },
    {
        icon: Info,
        title: 'Step 3: Check the Details',
        description: "Click on any product to see detailed descriptions, photos, vendor information, and customer reviews to make an informed decision.",
    },
    {
        icon: MessageSquare,
        title: 'Step 4: Chat with the Vendor',
        description: "Have questions? Use the chat feature on the product page to talk directly with the seller before you commit to a purchase.",
    },
    {
        icon: Heart,
        title: 'Step 5: Save Your Favorites',
        description: "Not ready to buy yet? Add items to your favorites to easily find them later from your profile.",
    },
    {
        icon: Lock,
        title: 'Step 6: Secure Purchase',
        description: "When you're ready, proceed with our secure payment system. Remember to follow our safety tips, like meeting in public and inspecting the item first.",
        cta: 'View Safety Tips',
        link: '/products/1', // Placeholder link, SafetyTips are on product page
    },
];

export default function HowToShopPage() {
  return (
    <div className="container mx-auto py-12 max-w-4xl">
        <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground">
                How to Shop Safely on EliteHub
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                Follow our simple guide to start shopping with confidence from the best vendors.
            </p>
        </header>

        <div className="relative space-y-12">
            {/* Dashed line */}
            <div className="absolute left-1/2 -translate-x-1/2 h-full w-px bg-border border-l-2 border-dashed top-4 hidden md:block" />

            {shoppingSteps.map((step, index) => (
                <div key={index} className="flex flex-col md:flex-row items-center gap-8">
                     {/* Icon and Connector - Left */}
                    <div className="hidden md:flex flex-col items-center w-1/4">
                       {index % 2 === 0 && (
                         <div className="flex-1 w-full flex items-center">
                            <div className="w-full h-px bg-border"></div>
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center z-10">
                                <step.icon className="h-5 w-5" />
                            </div>
                        </div>
                       )}
                    </div>

                     {/* Card */}
                    <Card className="w-full md:w-1/2 shadow-xl hover:shadow-2xl transition-shadow z-20">
                         {/* Icon for mobile */}
                        <div className="md:hidden flex justify-center pt-6">
                            <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                <step.icon className="h-6 w-6" />
                            </div>
                        </div>
                        <CardHeader className="text-center">
                            <CardTitle>{step.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-muted-foreground mb-6">{step.description}</p>
                            {step.cta && step.link && (
                                <Link href={step.link}>
                                    <Button>
                                        {step.cta} <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>

                    {/* Icon and Connector - Right */}
                     <div className="hidden md:flex flex-col items-center w-1/4">
                       {index % 2 !== 0 && (
                         <div className="flex-1 w-full flex items-center">
                             <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center z-10">
                                <step.icon className="h-5 w-5" />
                            </div>
                            <div className="w-full h-px bg-border"></div>
                        </div>
                       )}
                    </div>

                </div>
            ))}
        </div>
    </div>
  );
}
