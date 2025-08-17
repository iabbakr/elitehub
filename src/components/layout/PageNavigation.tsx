
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PageNavigation({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const isHomePage = pathname === '/';

  return (
    <div className="flex-grow flex flex-col">
      {!isHomePage && (
        <div className="mb-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      )}
      {children}
    </div>
  );
}
