
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target, Eye, ShieldCheck, Users, Handshake } from 'lucide-react';
import Image from 'next/image';

const coreValues = [
    {
        icon: ShieldCheck,
        title: "Unyielding Trust",
        description: "Every vendor, every product, and every service is held to the highest standard. We verify so you can transact with complete peace of mind."
    },
    {
        icon: Handshake,
        title: "Empowering Connections",
        description: "We are more than a marketplace; we are a community. We build bridges between buyers, sellers, and service providers, fostering growth and opportunity."
    },
    {
        icon: Users,
        title: "Community-Centric",
        description: "Our platform is built for Nigerians, by Nigerians. We are dedicated to creating a space that understands and serves the unique needs of our local market."
    }
];

export default function AboutPage() {
  return (
    <div className="container mx-auto py-12 max-w-5xl space-y-16">
        <header className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground">
                The Gold Standard of Nigerian Commerce.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                EliteHub was born from a simple yet powerful idea: to create a digital marketplace where trust is not an option, but a guarantee. We are a premier referral-based platform dedicated to connecting you with Nigeria's most reliable vendors and professional service providers.
            </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
                 <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 bg-primary text-primary-foreground rounded-md h-12 w-12 flex items-center justify-center">
                        <Target className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold font-headline">Our Mission</h2>
                        <p className="text-muted-foreground mt-2">
                            To build Nigeria's most secure and dependable online ecosystem, where every transaction is seamless, every interaction is trustworthy, and every user feels empowered and protected.
                        </p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 bg-primary text-primary-foreground rounded-md h-12 w-12 flex items-center justify-center">
                        <Eye className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold font-headline">Our Vision</h2>
                        <p className="text-muted-foreground mt-2">
                           We envision a future where all Nigerians can engage in digital commerce with absolute confidence, knowing that a trusted, verified, and community-focused platform supports them every step of the way.
                        </p>
                    </div>
                </div>
            </div>
             <div className="relative h-80 rounded-xl overflow-hidden">
                <Image src="https://placehold.co/600x400.png" alt="A team of professionals collaborating" layout="fill" objectFit="cover" data-ai-hint="team collaboration" />
            </div>
        </div>

        <section className="text-center">
            <h2 className="text-3xl font-bold font-headline">Our Core Values</h2>
            <p className="mt-2 text-muted-foreground">The principles that guide every decision we make.</p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                {coreValues.map(value => {
                    const Icon = value.icon;
                    return (
                        <Card key={value.title} className="text-center hover:shadow-xl transition-shadow">
                            <CardHeader className="items-center">
                                <div className="flex-shrink-0 bg-primary/10 text-primary rounded-full h-16 w-16 flex items-center justify-center">
                                    <Icon className="h-8 w-8" />
                                </div>
                                <CardTitle className="mt-4">{value.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{value.description}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </section>
    </div>
  );
}
