'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PageNavigation({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const isHomePage = pathname === '/';

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50; // Minimum distance for a swipe
    if (touchStartX.current - touchEndX.current > swipeThreshold) {
      // Swiped left - go back
      router.back();
    }

    if (touchEndX.current - touchStartX.current > swipeThreshold) {
      // Swiped right - go forward
      router.forward();
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="flex-grow flex flex-col"
    >
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
