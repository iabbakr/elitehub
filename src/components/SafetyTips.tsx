
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

const safetyTips = [
  "Avoid sending any prepayments.",
  "Meet with the seller at a safe public place.",
  "Inspect what you're going to buy to make sure it's what you need.",
  "Check all the documents and only pay if you're satisfied.",
];

export function SafetyTips() {
  return (
    <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
          <Lightbulb className="h-6 w-6" />
          Safety Tips
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-400 list-disc pl-5">
          {safetyTips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
