
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { CurrencyExchangeAgent } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BadgeCheck, Search, MapPin, Star, ArrowRightLeft, CircleDollarSign, Bitcoin, Crown, Gem, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchCurrencyExchangeAgents, nigerianStates } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ViewToggle, type ViewMode } from '@/components/ViewToggle';

export default function FindCurrencyExchangePage() {
  const [agents, setAgents] = useState<CurrencyExchangeAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    const getAgents = async () => {
      const fetchedAgents = await fetchCurrencyExchangeAgents();
      // Filter for active profiles based on subscription
      const now = new Date();
      const activeAgents = fetchedAgents.filter(agent => 
        agent.profileVisibleUntil && new Date(agent.profileVisibleUntil) > now
      );
      setAgents(activeAgents);
      setLoading(false);
    };
    getAgents();
  }, []);

  const filteredAgents = useMemo(() => {
    let filtered = [...agents];

    if (searchTerm) {
        filtered = filtered.filter(agent => 
            agent.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (selectedLocation !== 'all') {
        filtered = filtered.filter(agent =>
            agent.location === selectedLocation
        );
    }
    
    // Sort by tier: vvip -> vip -> others
    filtered.sort((a, b) => {
        const tierOrder = { 'vvip': 2, 'vip': 1 };
        const tierA = a.tier ? tierOrder[a.tier as keyof typeof tierOrder] || 0 : 0;
        const tierB = b.tier ? tierOrder[b.tier as keyof typeof tierOrder] || 0 : 0;
        if (tierB !== tierA) return tierB - tierA;
        return (b.rating || 0) - (a.rating || 0);
    });

    return filtered;
  }, [agents, searchTerm, selectedLocation]);

  return (
    <div>
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground flex items-center justify-center gap-3">
          <ArrowRightLeft className="h-10 w-10 text-primary" />
          Currency Exchange
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          Find reliable and verified agents for your Fiat and Crypto exchange needs.
        </p>
      </header>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-2">
            <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Search by business or agent name..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {nigerianStates.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
       </div>
       <div className="flex justify-end mb-8 max-w-2xl mx-auto">
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
       </div>

       {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
                <Card key={i} className="flex flex-col text-center p-6">
                    <Skeleton className="h-20 w-20 rounded-full mx-auto" />
                    <Skeleton className="h-8 w-3/4 mx-auto mt-4" />
                    <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
                    <Skeleton className="h-10 w-full mt-6" />
                </Card>
            ))}
        </div>
      ) : filteredAgents.length > 0 ? (
      <div className={cn(
          "gap-8",
          viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"
      )}>
        {filteredAgents.map((agent) => (
          viewMode === 'grid' ? (
              <Card key={agent.id} className="flex flex-col text-center hover:shadow-xl transition-shadow duration-300 rounded-xl">
                <CardHeader className="items-center">
                  <div className="relative">
                    <Image
                      src={agent.profileImage}
                      alt={`${agent.businessName} logo`}
                      width={80}
                      height={80}
                      className="rounded-full object-cover border-4 border-background outline outline-2 outline-border"
                    />
                     {agent.tier === 'vvip' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                               <Badge variant="destructive" className="absolute -top-1 -right-2 p-1 h-auto w-auto">
                                  <Award className="h-4 w-4"/>
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Highly Recommended</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                     )}
                     {agent.isVerified && (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-background">
                          <BadgeCheck className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-2xl font-headline mt-4 flex items-center justify-center gap-2">
                    <span>{agent.businessName}</span>
                     {agent.tier === 'vip' && <Crown className="h-6 w-6 text-yellow-500" />}
                     {agent.tier === 'vvip' && <Gem className="h-6 w-6 text-purple-500" />}
                  </CardTitle>
                   <CardDescription className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {agent.city}, {agent.location}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-center items-center">
                    <div className="flex items-center justify-center gap-4">
                        {agent.currenciesAccepted.includes('Fiat') && <Badge variant="secondary" className="gap-1"><CircleDollarSign className="h-4 w-4" /> Fiat</Badge>}
                        {agent.currenciesAccepted.includes('Crypto') && <Badge variant="secondary" className="gap-1"><Bitcoin className="h-4 w-4" /> Crypto</Badge>}
                    </div>
                     <div className="flex items-center justify-center gap-1 text-yellow-500 mt-4">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={cn('h-4 w-4', (agent.rating || 0) > i ? 'fill-current' : 'text-gray-300')} />
                        ))}
                         <span className="ml-1 text-xs text-muted-foreground">({agent.ratingCount || 0})</span>
                    </div>
                </CardContent>
                <div className="p-6 pt-2">
                  <Link href={`/currency-exchange/${agent.id}`} passHref>
                    <Button className="w-full">View Profile</Button>
                  </Link>
                </div>
              </Card>
          ) : (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Image src={agent.profileImage} alt={`${agent.businessName} logo`} width={64} height={64} className="rounded-full object-cover"/>
                        <div>
                            <Link href={`/currency-exchange/${agent.id}`} className="font-bold hover:underline">{agent.businessName}</Link>
                            <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3"/>{agent.city}, {agent.location}</p>
                             <div className="flex items-center gap-1 text-yellow-500 mt-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={cn('h-4 w-4', (agent.rating || 0) > i ? 'fill-current' : 'text-gray-300')} />
                                ))}
                                <span className="ml-1 text-xs text-muted-foreground">({agent.ratingCount || 0})</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                         <div className="flex items-center gap-2">
                           {agent.currenciesAccepted.includes('Fiat') && <Badge variant="secondary" className="gap-1"><CircleDollarSign className="h-4 w-4" /> Fiat</Badge>}
                           {agent.currenciesAccepted.includes('Crypto') && <Badge variant="secondary" className="gap-1"><Bitcoin className="h-4 w-4" /> Crypto</Badge>}
                         </div>
                        <Button asChild size="sm">
                            <Link href={`/currency-exchange/${agent.id}`}>View Profile</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
          )
        ))}
      </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
            <ArrowRightLeft className="mx-auto h-12 w-12" />
            <p className="mt-4">No active currency exchange agents found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
