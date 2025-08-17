
import { notFound } from 'next/navigation';
import { fetchLogisticsCompanyById, fetchLogisticsCompanies } from '@/lib/data';
import type { Metadata } from 'next';
import { CompanyProfileClientPage } from './CompanyProfileClientPage';

export async function generateStaticParams() {
  const companies = await fetchLogisticsCompanies();
  return companies.map((company) => ({
    companyId: company.id,
  }));
}

export async function generateMetadata({ params }: { params: { companyId: string } }): Promise<Metadata> {
  const company = await fetchLogisticsCompanyById(params.companyId);

  if (!company) {
    return {
      title: 'Logistics Company Not Found',
      description: 'The logistics company you are looking for does not exist on our platform.',
    };
  }

  const shortDescription = company.bio.substring(0, 155);

  return {
    title: `${company.name} - ${company.category} in ${company.location}`,
    description: shortDescription,
    keywords: [company.name, 'logistics', 'delivery', company.category, company.location],
    openGraph: {
      title: `${company.name} on EliteHub Marketplace`,
      description: shortDescription,
      images: [
        {
          url: company.profileImage,
          width: 200,
          height: 200,
          alt: `${company.name} logo`,
        },
      ],
      url: `https://www.elitehubng.com/logistics/${company.id}`,
      siteName: 'EliteHub Marketplace',
      type: 'profile',
    },
    alternates: {
      canonical: `https://www.elitehubng.com/logistics/${company.id}`,
    },
  };
}


export default function CompanyProfilePage({ params }: { params: { companyId: string } }) {
    const companyPromise = fetchLogisticsCompanyById(params.companyId);
    
    const Page = async () => {
        const company = await companyPromise;
        if (!company) {
            notFound();
        }
        return <CompanyProfileClientPage initialCompany={company} />;
    }
    
    return <Page />;
}
