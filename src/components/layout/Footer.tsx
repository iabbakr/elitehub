
'use client';

import Link from 'next/link';
import { ShieldCheck, Twitter, Mail, Instagram, Youtube } from 'lucide-react';
import { Logo } from '../Logo';

const TikTokIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
    <path d="M12 12v10" />
    <path d="M8 8v10" />
    <path d="M12 2a4 4 0 0 0-4 4v0" />
  </svg>
);


export function Footer() {
  const year = new Date().getFullYear();

  const footerLinks = {
    'Need Help?': [
      { href: '/contact', text: 'Contact Us' },
      { href: '/how-to-sell', text: 'How to become a vendor and sell on Elitehub?' },
      { href: '/how-to-shop', text: 'How to shop on Elitehub?' },
      { href: '/how-to-register-services', text: 'How to register for other services on Elitehub?' },
    ],
    'ABOUT ELITEHUB': [
      { href: '/about', text: 'About us' },
      { href: '/terms', text: 'Terms and Conditions' },
      { href: '/privacy', text: 'Privacy Notice' },
      { href: '/privacy', text: 'Cookie Notice' },
    ]
  };

  return (
    <footer className="bg-card border-t mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
             <div>
                <h3 className="font-bold text-lg mb-4">Need Help?</h3>
                <ul className="space-y-2">
                    {footerLinks['Need Help?'].map(link => (
                        <li key={link.text}>
                            <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                {link.text}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
             <div>
                <h3 className="font-bold text-lg mb-4">ABOUT ELITEHUB</h3>
                <ul className="space-y-2">
                    {footerLinks['ABOUT ELITEHUB'].map(link => (
                        <li key={link.text}>
                            <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                {link.text}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
             <div>
                <h3 className="font-bold text-lg mb-4">JOIN US ON</h3>
                 <div className="flex items-center gap-4">
                    <Link href="https://x.com/elitehubng" className="text-muted-foreground hover:text-primary transition-colors">
                        <Twitter className="h-5 w-5" />
                        <span className="sr-only">X</span>
                    </Link>
                    <Link href="mailto:elitehubng@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">
                        <Mail className="h-5 w-5" />
                        <span className="sr-only">Gmail</span>
                    </Link>
                    <Link href="https://www.instagram.com/elitehubng" className="text-muted-foreground hover:text-primary transition-colors">
                        <Instagram className="h-5 w-5" />
                        <span className="sr-only">Instagram</span>
                    </Link>
                    <Link href="https://www.tiktok.com/@elitehub.ng" className="text-muted-foreground hover:text-primary transition-colors">
                        <TikTokIcon />
                        <span className="sr-only">TikTok</span>
                    </Link>
                    <Link href="https://www.youtube.com/@Elitehubng" className="text-muted-foreground hover:text-primary transition-colors">
                        <Youtube className="h-5 w-5" />
                        <span className="sr-only">YouTube</span>
                    </Link>
                </div>
            </div>
        </div>

        <div className="border-t mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <Logo className="h-auto" />
          <p className="text-sm text-muted-foreground text-center md:text-left">&copy; {year} EliteHub NG. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
