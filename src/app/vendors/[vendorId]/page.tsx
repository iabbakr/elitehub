
import { notFound } from 'next/navigation';
import { fetchVendorById, fetchProductsByVendorId, fetchVendors, type Vendor, type Product } from '@/lib/data';
import type { Metadata } from 'next';
import { VendorProfilePageClient } from './VendorProfilePageClient';
import type { AppPageProps } from '@/types/page';


export async function generateStaticParams() {
  const vendors = await fetchVendors();
  return vendors.map((vendor) => ({
    vendorId: vendor.id,
  }));
}

export async function generateMetadata({ params }: AppPageProps<{ vendorId: string }>): Promise<Metadata> {
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


export default async function VendorProfilePage({ params }: AppPageProps<{ vendorId: string }>) {
  const [vendor, vendorProducts] = await Promise.all([
    fetchVendorById(params.vendorId),
    fetchProductsByVendorId(params.vendorId)
  ]);
  
  if (!vendor) {
    notFound();
  }
  
  return <VendorProfilePageClient initialVendor={vendor} initialProducts={vendorProducts} />;
}
