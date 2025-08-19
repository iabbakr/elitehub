
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, UserPlus, FileText, Clock, UserCheck, Wrench, Truck, ArrowRightLeft, Scale } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const serviceSteps = [
    {
        icon: UserPlus,
        title: 'Step 1: Create a Buyer Account',
        description: "If you don't have one, sign up for free. This gives you access to the marketplace and is the first step to becoming a provider.",
    },
    {
        icon: FileText,
        title: 'Step 2: Fill Out the Application',
        description: "From the main menu or footer, find the appropriate registration link. You'll be directed to a form to provide your professional details.",
    },
    {
        icon: Clock,
        title: 'Step 3: Await Admin Approval',
        description: "Our team will review your application. This process is usually quick, and you'll be notified via email once a decision is made.",
    },
    {
        icon: UserCheck,
        title: 'Step 4: Access Your Profile',
        description: 'Once approved, your account is upgraded. You can now access your professional profile to manage your services and interact with clients.',
    },
];

export default function HowToRegisterServicesPage() {
  return (
    <div className="container mx-auto py-12 max-w-4xl">
        <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground">
                Join Our Network of Professionals
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                Follow these simple steps to register as a Service Provider, Logistics Partner, Lawyer, or Currency Exchange Agent.
            </p>
        </header>

        <Tabs defaultValue="service" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="service"><Wrench className="mr-2 h-4 w-4" />Services</TabsTrigger>
                <TabsTrigger value="logistics"><Truck className="mr-2 h-4 w-4" />Logistics</TabsTrigger>
                <TabsTrigger value="lawyer"><Scale className="mr-2 h-4 w-4" />Lawyers</TabsTrigger>
                <TabsTrigger value="exchange"><ArrowRightLeft className="mr-2 h-4 w-4" />Exchange</TabsTrigger>
            </TabsList>
            <TabsContent value="service">
                 <RegistrationSteps cta="Register as a Service Provider" link="/register-service" />
            </TabsContent>
             <TabsContent value="logistics">
                 <RegistrationSteps cta="Register as a Logistics Partner" link="/register-logistics" />
            </TabsContent>
            <TabsContent value="lawyer">
                 <RegistrationSteps cta="Register as a Lawyer" link="/register-lawyer" />
            </TabsContent>
             <TabsContent value="exchange">
                <RegistrationSteps cta="Register as an Exchange Agent" link="/register-currency-exchange" />
            </TabsContent>
        </Tabs>
    </div>
  );
}

function RegistrationSteps({ cta, link }: { cta: string, link: string }) {
    return (
        <div className="relative space-y-8 mt-8">
            {serviceSteps.map((step, index) => (
                <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6 flex items-start gap-6">
                        <div className="flex-shrink-0 bg-primary/10 text-primary rounded-full h-12 w-12 flex items-center justify-center">
                            <step.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">{step.title}</h3>
                            <p className="text-muted-foreground mt-1">{step.description}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
             <Card className="bg-primary/10 border-primary/20">
                <CardContent className="p-6 text-center">
                    <h3 className="text-xl font-bold">Ready to Start?</h3>
                    <p className="text-muted-foreground my-2">Begin your application now and connect with new clients.</p>
                     <Link href={link}>
                        <Button size="lg">
                            {cta} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}
