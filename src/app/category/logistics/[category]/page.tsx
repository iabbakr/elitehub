

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { LogisticsCompany } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BadgeCheck, Search, MapPin, Star, Truck, FileCheck2, Crown, Gem, Award, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchLogisticsCompanies, nigerianStates, logisticsCategories } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const shuffleArray = <T,>(array: T[]): T[] => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
};

export default function FindLogisticsByCategoryPage() {
  const params = useParams();
  const categoryId = Array.isArray(params.category) ? params.category[0] : params.category;
  
  const [companies, setCompanies] = useState<LogisticsCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');

  const category = useMemo(() => {
    return logisticsCategories.find(c => c.id === categoryId);
  }, [categoryId]);

  useEffect(() => {
    if (!category) return;
    const getCompanies = async () => {
      setLoading(true);
      const fetchedCompanies = await fetchLogisticsCompanies(category.name);
      setCompanies(fetchedCompanies);
      setLoading(false);
    };
    getCompanies();
  }, [category]);
  
  if (!category) {
      notFound();
  }

  const filteredCompanies = useMemo(() => {
    let filtered = [...companies];

    if (searchTerm) {
        filtered = filtered.filter(company => 
            company.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (selectedLocation !== 'all') {
        filtered = filtered.filter(company =>
            company.location === selectedLocation
        );
    }
    
    const tierOrder = { 'vvip': 2, 'vip': 1 };
    
    // Sort by tier: vvip -> vip -> boosted -> others
    filtered.sort((a, b) => {
        const tierA = a.tier ? tierOrder[a.tier as keyof typeof tierOrder] || 0 : 0;
        const tierB = b.tier ? tierOrder[b.tier as keyof typeof tierOrder] || 0 : 0;
        if (tierB !== tierA) return tierB - tierA; // Sort by tier first

        const boostedA = a.boostedUntil && new Date(a.boostedUntil) > new Date();
        const boostedB = b.boostedUntil && new Date(b.boostedUntil) > new Date();
        if (boostedB !== boostedA) return (boostedB ? 1 : 0) - (boostedA ? 1 : 0); // Then by boost status

        return (b.rating || 0) - (a.rating || 0); // Finally by rating
    });

    return filtered;
  }, [companies, searchTerm, selectedLocation]);

  return (
    <div>
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground flex items-center justify-center gap-3">
          <Truck className="h-10 w-10 text-primary" />
          {category.name}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          Find reliable and verified partners for your {category.name.toLowerCase()} needs.
        </p>
      </header>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
            <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Search by company name..."
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
      ) : filteredCompanies.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCompanies.map((company) => (
          <Card key={company.id} className="flex flex-col text-center hover:shadow-xl transition-shadow duration-300 rounded-xl">
            <CardHeader className="items-center">
              <div className="relative">
                <Image
                  src={company.profileImage}
                  alt={`${company.name} logo`}
                  width={80}
                  height={80}
                  className="rounded-full object-cover border-4 border-background outline outline-2 outline-border"
                />
                 {company.tier === 'vvip' && (
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
                 {company.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-background">
                      <BadgeCheck className="h-4 w-4" />
                  </div>
                 )}
                 {company.boostedUntil && new Date(company.boostedUntil) > new Date() && !company.tier && (
                  <div className="absolute -bottom-1 -left-1 bg-purple-500 text-white rounded-full p-1 border-2 border-background">
                      <Zap className="h-4 w-4" />
                  </div>
                 )}
              </div>
              <CardTitle className="text-2xl font-headline mt-4 flex items-center justify-center gap-2">
                <span>{company.name}</span>
                {company.tier === 'vip' && <Crown className="h-6 w-6 text-yellow-500" />}
                {company.tier === 'vvip' && <Gem className="h-6 w-6 text-purple-500" />}
              </CardTitle>
               <CardDescription className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
                <MapPin className="h-4 w-4" /> {company.city}, {company.location}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-center items-center">
                {company.rcNumber && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <FileCheck2 className="h-4 w-4" /> 
                        <span>RC: {company.rcNumber}</span>
                    </div>
                )}
                 <div className="flex items-center justify-center gap-1 text-yellow-500 mt-4">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn('h-4 w-4', (company.rating || 0) > i ? 'fill-current' : 'text-gray-300')} />
                    ))}
                     <span className="ml-1 text-xs text-muted-foreground">({company.ratingCount || 0})</span>
                </div>
            </CardContent>
            <div className="p-6 pt-2">
              <Link href={`/logistics/${company.id}`} passHref>
                <Button className="w-full">View Profile</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
       ) : (
          <div className="text-center py-16 text-muted-foreground">
              <Truck className="mx-auto h-12 w-12" />
              <p className="mt-4">No logistics partners found in this category yet.</p>
          </div>
       )}
    </div>
  );
}
