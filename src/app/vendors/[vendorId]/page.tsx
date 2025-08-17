
'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ShieldCheck } from 'lucide-react';
import { VendorDashboard } from '@/components/vendor/VendorDashboard';
import { PublicVendorProfile } from '@/components/vendor/PublicVendorProfile';
import { fetchVendorById, fetchProductsByVendorId, type Vendor, type Product, fetchVendors } from '@/lib/data';
import type { Metadata } from 'next';

type Props = {
  params: { vendorId: string }
}

export async function generateStaticParams() {
  const vendors = await fetchVendors();
  return vendors.map((vendor) => ({
    vendorId: vendor.id,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const vendor = await fetchVendorById(params.vendorId);

  if (!vendor) {
    return {
      title: 'Vendor Not Found',
      description: 'The vendor you are looking for does not exist.',
    };
  }

  const shortDescription = vendor.businessDescription.substring(0, 155);

  return {
    title: `${vendor.name} - Trusted Vendor on EliteHub`,
    description: shortDescription,
    keywords: [vendor.name, 'trusted vendor', 'nigeria', ...vendor.categories.map(c => c)],
    openGraph: {
      title: `${vendor.name} on EliteHub Marketplace`,
      description: shortDescription,
      images: [
        {
          url: vendor.profileImage,
          width: 200,
          height: 200,
          alt: `${vendor.name} logo`,
        },
      ],
      url: `https://www.elitehubng.com/vendors/${vendor.id}`,
      siteName: 'EliteHub Marketplace',
      type: 'profile',
    },
     alternates: {
      canonical: `https://www.elitehubng.com/vendors/${vendor.id}`,
    },
  };
}


export default function VendorProfilePage({ params }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const vendorId = params.vendorId;

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
