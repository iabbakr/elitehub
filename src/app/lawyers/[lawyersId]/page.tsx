
import { notFound } from 'next/navigation';
import { fetchLawyerById, fetchLawyers } from '@/lib/data';
import type { Metadata } from 'next';
import { LawyerProfileClientPage } from './LawyerProfileClientPage';
import type { PageProps } from '@/types/page';

export async function generateStaticParams() {
  const lawyers = await fetchLawyers();
  return lawyers.map((lawyer) => ({
    lawyerId: lawyer.id,
  }));
}

export async function generateMetadata({ params }: PageProps<{ lawyerId: string }>): Promise<Metadata> {
  const { lawyerId } = await params;
  const lawyer = await fetchLawyerById(lawyerId);

  if (!lawyer) {
    return {
      title: 'Lawyer Not Found',
      description: 'The legal professional you are looking for does not exist on our platform.',
    };
  }

  const shortDescription = lawyer.bio.substring(0, 155);

  return {
    title: `${lawyer.fullName} - Verified Lawyer in ${lawyer.location}`,
    description: shortDescription,
    keywords: [lawyer.fullName, 'lawyer', 'legal services', 'nigeria', ...lawyer.practiceAreas],
    openGraph: {
      title: `${lawyer.fullName} - EliteHub Verified Lawyer`,
      description: shortDescription,
      images: [
        {
          url: lawyer.profileImage,
          width: 200,
          height: 200,
          alt: `Profile of ${lawyer.fullName}`,
        },
      ],
      url: `https://www.elitehubng.com/lawyers/${lawyer.id}`,
      siteName: 'EliteHub Marketplace',
      type: 'profile',
    },
     alternates: {
      canonical: `https://www.elitehubng.com/lawyers/${lawyer.id}`,
    },
  };
}


export default async function LawyerProfilePage({ params }: PageProps<{ lawyerId: string }>) {
    const { lawyerId } = await params;
    const lawyer = await fetchLawyerById(lawyerId);
    if (!lawyer) {
        notFound();
    }
    return <LawyerProfileClientPage initialLawyer={lawyer} />;
}
