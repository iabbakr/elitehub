
'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { VendorDashboard } from '@/components/vendor/VendorDashboard';
import { PublicVendorProfile } from '@/components/vendor/PublicVendorProfile';
import { type Vendor, type Product } from '@/lib/data';

interface VendorProfilePageClientProps {
  initialVendor: Vendor;
  initialProducts: Product[];
}

export function VendorProfilePageClient({ initialVendor, initialProducts }: VendorProfilePageClientProps) {
  const { user, loading: authLoading } = useAuth();
  
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Loading Profile...</p>
      </div>
    );
  }
  
  const isOwner = user && initialVendor.uid && user.uid === initialVendor.uid;

  if (isOwner) {
    return <VendorDashboard vendor={initialVendor} products={initialProducts} />;
  }
  
  return <PublicVendorProfile vendor={initialVendor} products={initialProducts} />;
}
