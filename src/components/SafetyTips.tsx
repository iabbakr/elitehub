
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lightbulb, ShieldCheck, UserCheck } from 'lucide-react';
import Link from 'next/link';

const safetyTips = [
  {
    title: "Avoid Prepayments",
    description: "Never send money in advance for products or services you haven’t received or confirmed."
  },
  {
    title: "Meet in Safe Public Places",
    description: "Arrange to meet vendors in their office address, or well-lit, busy public locations for added safety."
  },
  {
    title: "Inspect Before You Pay",
    description: "Carefully check the product or service to make sure it matches what was agreed."
  },
  {
    title: "Verify All Documents",
    description: "Review receipts, warranties, proof of ownership, and any other important documents before completing payment."
  },
  {
    title: "Confirm Vendor Verification",
    description: "Look out for our verified vendor badge to ensure you’re dealing with trusted sellers."
  },
  {
    title: "Trust Your Instincts",
    description: "If an offer sounds too good to be true, it usually is. Walk away from suspicious deals."
  },
  {
    title: "Report Suspicious Activity",
    description: "If you encounter a suspicious user, report them immediately through our app’s reporting system."
  }
];

export function SafetyTips() {
  return (
    <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-amber-800 dark:text-amber-300">
          <Lightbulb className="h-6 w-6" />
          Safety Tips for Secure Transactions
        </CardTitle>
        <CardDescription className="text-amber-700/80 dark:text-amber-400/80">
            To keep your transactions safe and stress-free, always follow these guidelines:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4 text-sm text-amber-700 dark:text-amber-400">
          {safetyTips.map((tip, index) => (
            <li key={index} className="flex gap-3">
                <UserCheck className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                    <span className="font-bold">{tip.title}:</span> {tip.description}
                </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 pt-4 border-t border-amber-300/50 dark:border-amber-600/50">
             <div className="flex items-start gap-3 text-sm text-blue-800 dark:text-blue-300 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50">
                <ShieldCheck className="h-8 w-8 flex-shrink-0" />
                <div>
                    <h4 className="font-bold">Legal Assistance is Available</h4>
                    <p className="text-xs">If you ever fall victim to a scam or fraudulent activity, remember: you can always find and <Link href="/category/find-a-lawyer" className="font-semibold underline hover:text-blue-600 dark:hover:text-blue-200">consult a lawyer</Link> directly on EliteHub to help recover your funds and protect your rights.</p>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
