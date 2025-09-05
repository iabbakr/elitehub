       
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { fetchVendorByUid } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function AddProductFAB() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isVendor, setIsVendor] = useState(false);

  useEffect(() => {
    const checkVendorStatus = async () => {
      if (user) {
        const vendor = await fetchVendorByUid(user.uid);
        setIsVendor(!!vendor);
      } else {
        setIsVendor(false);
      }
    };

    checkVendorStatus();
  }, [user]);

  // Don't show the button on these specific paths
  const hiddenPaths = ['/admin', '/login', '/signup', '/register'];
  if (hiddenPaths.some(path => pathname.startsWith(path))) {
    return null;
  }

  if (!isVendor) {
    return null;
  }

  return (
    <Link href="/profile/products?addProduct=true" passHref>
      <Button
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50"
        size="icon"
        title="Add New Product"
      >
        <Plus className="h-8 w-8" />
      </Button>
    </Link>
  );
}
