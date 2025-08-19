
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Mail } from 'lucide-react';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="0"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16.75 13.96c.25.13.42.2.46.3.05.1.04.57-.13.78-.17.2-.9.56-1.25.68-.34.11-1.04.1-1.28-.08-.23-.17-1.4-1.2-2.13-1.85-.6-.53-1.03-.86-1.03-1.03v-.02c.01-.15.18-.32.33-.47.15-.15.33-.26.4-.33.08-.07.12-.11.17-.2.05-.08.03-.17-.02-.28-.05-.1-.2-.28-.27-.38-.07-.1-.15-.08-.22-.05l-.34.13-.13.06c-.52.25-1.03.73-1.13 1.3-.1.57.22 1.08.3 1.18.08.1.75.98 1.82 1.6 1.07.63 1.8.85 2.18.9.38.05.9.03 1.25-.2s1.12-1.3 1.28-1.72c.15-.42.15-.78.1-.85-.05-.08-.17-.12-.33-.2zM12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
  </svg>
);


const contactOptions = [
    { type: 'whatsapp', label: 'WhatsApp Line 1', href: 'https://wa.me/2348140002708' },
    { type: 'whatsapp', label: 'WhatsApp Line 2', href: 'https://wa.me/2347072600715' },
    { type: 'whatsapp', label: 'WhatsApp Line 3', href: 'https://wa.me/2349048883488' },
    { type: 'email', label: 'Email Support', href: 'mailto:elitehubng@gmail.com' }
]

export default function ContactPage() {
  return (
    <div className="container mx-auto py-12 max-w-2xl">
        <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground">
                Contact Us
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                We're here to help. Choose your preferred way to get in touch with our support team.
            </p>
        </header>

        <Card className="shadow-xl">
            <CardHeader>
                <CardTitle>Support Channels</CardTitle>
                <CardDescription>Click on a link below to start a conversation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {contactOptions.map(option => (
                    <a 
                        key={option.label}
                        href={option.href} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block"
                    >
                        <Button 
                            variant="outline" 
                            className="w-full h-16 justify-start text-lg"
                        >
                            {option.type === 'whatsapp' ? 
                                <WhatsAppIcon className="mr-4 h-8 w-8 text-green-500"/> :
                                <Mail className="mr-4 h-8 w-8 text-primary"/>
                            }
                            {option.label}
                        </Button>
                    </a>
                ))}
            </CardContent>
        </Card>
    </div>
  );
}
