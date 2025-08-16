

'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ShieldCheck } from 'lucide-react';
import { VendorDashboard }  from '@/components/vendor/VendorDashboard';
import { PublicVendorProfile } from '@/components/vendor/PublicVendorProfile';
import { fetchVendorById, fetchProductsByVendorId, type Vendor, type Product } from '@/lib/data';

export default function VendorProfilePage() {
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const vendorId = Array.isArray(params.vendorId) ? params.vendorId[0] : params.vendorId;

  useEffect(() => {
    if (vendorId) {
      const getVendorAndProducts = async () => {
        setLoading(true);
        const [fetchedVendor, fetchedProducts] = await Promise.all([
            fetchVendorById(vendorId),
            fetchProductsByVendorId(vendorId)
        ]);
        setVendor(fetchedVendor);
        setVendorProducts(fetchedProducts);
        setLoading(false);
      };
      getVendorAndProducts();
    } else {
        setLoading(false);
    }
  }, [vendorId]);

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Loading Profile...</p>
      </div>
    );
  }
  
  if (!vendor) {
    notFound();
  }
  
  // Stricter check: only rely on UID for ownership verification.
  const isOwner = user && vendor.uid && user.uid === vendor.uid;

  if (isOwner) {
    return <VendorDashboard vendor={vendor} products={vendorProducts} />;
  }
  
  return <PublicVendorProfile vendor={vendor} products={vendorProducts} />;
}
