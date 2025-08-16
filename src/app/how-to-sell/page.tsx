

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, UserPlus, FileText, Clock, PackagePlus, Store } from 'lucide-react';
import Link from 'next/link';

const roadmapSteps = [
    {
        icon: UserPlus,
        title: 'Step 1: Create Your Account',
        description: "First, you'll need a buyer's account. If you don't have one, sign up for free. This gives you access to the marketplace and is the first step to becoming a seller.",
        cta: 'Create an Account',
        link: '/signup',
    },
    {
        icon: FileText,
        title: 'Step 2: Fill Out the Vendor Application',
        description: "From your profile or the main menu, find the 'Become a Vendor' link. You'll be directed to a registration form where you'll provide details about your business.",
        cta: 'Go to Registration',
        link: '/register',
    },
    {
        icon: Clock,
        title: 'Step 3: Await Admin Approval',
        description: "Our team will review your application to ensure it meets our quality and trust standards. This process is usually quick, and you'll be notified via email once a decision is made.",
    },
    {
        icon: Store,
        title: 'Step 4: Access Your Dashboard',
        description: 'Once approved, your account will be upgraded to a vendor account. You will now have access to your own Vendor Dashboard where you can manage your profile and products.',
        cta: 'Go to Profile',
        link: '/profile',
    },
    {
        icon: PackagePlus,
        title: 'Step 5: Start Selling!',
        description: "From your dashboard, you can start adding products, setting prices, and managing your inventory. Welcome to the EliteHub community of trusted sellers!",
        cta: 'Add Your First Product',
        link: '/profile/products',
    },
];

export default function HowToSellPage() {
  return (
    <div className="container mx-auto py-12 max-w-4xl">
        <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground">
                Your Roadmap to Selling on EliteHub
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                Follow these simple steps to join our community of trusted vendors and start growing your business.
            </p>
        </header>

        <div className="relative space-y-12">
            {/* Dashed line */}
            <div className="absolute left-1/2 -translate-x-1/2 h-full w-px bg-border border-l-2 border-dashed top-4 hidden md:block" />

            {roadmapSteps.map((step, index) => (
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
