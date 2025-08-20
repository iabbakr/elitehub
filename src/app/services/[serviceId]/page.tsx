
import { notFound } from 'next/navigation';
import { fetchServiceProviderById, fetchServiceProviders } from '@/lib/data';
import type { Metadata } from 'next';
import { ServiceProviderProfileClientPage } from './ServiceProviderProfileClientPage';
import type { PageProps } from '@/types/page';

export async function generateStaticParams() {
  const providers = await fetchServiceProviders();
  return providers.map((provider) => ({
    serviceId: provider.id,
  }));
}

export async function generateMetadata({ params }: PageProps<{ serviceId: string }>): Promise<Metadata> {
  const { serviceId } = await params;
  const provider = await fetchServiceProviderById(serviceId);

  if (!provider) {
    return {
      title: 'Service Provider Not Found',
      description: 'The service provider you are looking for does not exist on our platform.',
    };
  }

  const shortDescription = provider.bio.substring(0, 155);

  return {
    title: `${provider.businessName} - ${provider.serviceType} in ${provider.location}`,
    description: shortDescription,
    keywords: [provider.businessName, provider.serviceType, provider.serviceCategory, 'nigeria'],
    openGraph: {
      title: `${provider.businessName} on EliteHub Marketplace`,
      description: shortDescription,
      images: [
        {
          url: provider.profileImage,
          width: 200,
          height: 200,
          alt: `${provider.businessName} logo`,
        },
      ],
      url: `https://www.elitehubng.com/services/${provider.id}`,
      siteName: 'EliteHub Marketplace',
      type: 'profile',
    },
     alternates: {
      canonical: `https://www.elitehubng.com/services/${provider.id}`,
    },
  };
}


export default async function ServiceProviderProfilePage({ params }: PageProps<{ serviceId: string }>) {
    const { serviceId } = await params;
    const provider = await fetchServiceProviderById(serviceId);
    if (!provider) {
        notFound();
    }
    return <ServiceProviderProfileClientPage initialProvider={provider} />;
}
