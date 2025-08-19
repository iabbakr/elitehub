
import { notFound } from 'next/navigation';
import { fetchCurrencyExchangeAgentById, fetchCurrencyExchangeAgents } from '@/lib/data';
import type { Metadata } from 'next';
import { AgentProfileClientPage } from './AgentProfileClientPage';

type CurrencyExchangeAgentProfilePageProps = {
  params: { agentId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export async function generateStaticParams() {
  const agents = await fetchCurrencyExchangeAgents();
  return agents.map((agent) => ({
    agentId: agent.id,
  }));
}

export async function generateMetadata({ params }: { params: { agentId: string } }): Promise<Metadata> {
  const agent = await fetchCurrencyExchangeAgentById(params.agentId);

  if (!agent) {
    return {
      title: 'Agent Not Found',
      description: 'The currency exchange agent you are looking for does not exist.',
    };
  }

  const shortDescription = agent.bio.substring(0, 155);

  return {
    title: `${agent.businessName} - Currency Exchange in ${agent.location}`,
    description: shortDescription,
    keywords: [agent.businessName, 'currency exchange', 'fiat', 'crypto', agent.location],
    openGraph: {
      title: `${agent.businessName} on EliteHub Marketplace`,
      description: shortDescription,
      images: [
        {
          url: agent.profileImage,
          width: 200,
          height: 200,
          alt: `${agent.businessName} logo`,
        },
      ],
      url: `https://www.elitehubng.com/currency-exchange/${agent.id}`,
      siteName: 'EliteHub Marketplace',
      type: 'profile',
    },
    alternates: {
      canonical: `https://www.elitehubng.com/currency-exchange/${agent.id}`,
    },
  };
}


export default async function CurrencyExchangeAgentProfilePage({ params }: CurrencyExchangeAgentProfilePageProps) {
  const agent = await fetchCurrencyExchangeAgentById(params.agentId);
  if (!agent) {
    notFound();
  }
  return <AgentProfileClientPage initialAgent={agent} />;
}
