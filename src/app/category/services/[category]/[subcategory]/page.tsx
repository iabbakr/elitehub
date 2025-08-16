

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { ServiceProvider } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BadgeCheck, Search, MapPin, Star, Wrench, FileCheck2, Crown, Gem, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchServiceProvidersBySubCategory, nigerianStates, serviceCategories, serviceSubCategories } from '@/lib/data';
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

export default function FindServiceBySubCategoryPage() {
  const params = useParams();
  const categoryId = Array.isArray(params.category) ? params.category[0] : params.category;
  const subCategoryId = Array.isArray(params.subcategory) ? params.subcategory[0] : params.subcategory;
  
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');

  const category = useMemo(() => {
    return serviceCategories.find(c => c.id === categoryId);
  }, [categoryId]);
  
  const subCategory = useMemo(() => {
    if (!category) return null;
    const subCats = serviceSubCategories[category.name] || [];
    return subCats.find(s => s.toLowerCase().replace(/ /g, '-') === subCategoryId) || null;
  }, [category, subCategoryId]);


  useEffect(() => {
    if (!category || !subCategory) return;
    const getProviders = async () => {
      setLoading(true);
      const fetchedProviders = await fetchServiceProvidersBySubCategory(category.name, subCategory);
      setProviders(fetchedProviders);
      setLoading(false);
    };
    getProviders();
  }, [category, subCategory]);

  if (!category || !subCategory) {
      notFound();
  }

  const filteredProviders = useMemo(() => {
    let filtered = [...providers];

    if (searchTerm) {
        filtered = filtered.filter(provider => 
            provider.businessName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (selectedLocation !== 'all') {
        filtered = filtered.filter(provider =>
            provider.location === selectedLocation
        );
    }
    
    const tierOrder = { 'vvip': 2, 'vip': 1 };
    
    filtered.sort((a, b) => {
        const tierA = a.tier ? tierOrder[a.tier as keyof typeof tierOrder] || 0 : 0;
        const tierB = b.tier ? tierOrder[b.tier as keyof typeof tierOrder] || 0 : 0;
        if (tierB !== tierA) return tierB - tierA;

        const boostedA = a.boostedUntil && new Date(a.boostedUntil) > new Date();
        const boostedB = b.boostedUntil && new Date(b.boostedUntil) > new Date();
        if (boostedB !== boostedA) return (boostedB ? 1 : 0) - (boostedA ? 1 : 0);

        return (b.rating || 0) - (a.rating || 0);
    });

    return filtered;
  }, [providers, searchTerm, selectedLocation]);

  return (
    <div>
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground flex items-center justify-center gap-3">
          <Wrench className="h-10 w-10 text-primary" />
          {subCategory}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          Connect with verified professionals for your business and personal needs.
        </p>
      </header>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
            <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Search by business name..."
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
      ) : filteredProviders.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProviders.map((provider) => (
          <Card key={provider.id} className="flex flex-col text-center hover:shadow-xl transition-shadow duration-300 rounded-xl">
            <CardHeader className="items-center">
              <div className="relative">
                <Image
                  src={provider.profileImage}
                  alt={`${provider.businessName} logo`}
                  width={80}
                  height={80}
                  className="rounded-full object-cover border-4 border-background outline outline-2 outline-border"
                />
                 {provider.tier === 'vvip' && (
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
                {provider.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-background">
                      <BadgeCheck className="h-4 w-4" />
                  </div>
                )}
              </div>
              <CardTitle className="text-2xl font-headline mt-4 flex items-center justify-center gap-2">
                <span>{provider.businessName}</span>
                {provider.tier === 'vip' && <Crown className="h-6 w-6 text-yellow-500" />}
                {provider.tier === 'vvip' && <Gem className="h-6 w-6 text-purple-500" />}
              </CardTitle>
               <CardDescription className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
                <MapPin className="h-4 w-4" /> {provider.city}, {provider.location}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-center items-center">
               <div className="space-y-2">
                    {provider.rcNumber && (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <FileCheck2 className="h-4 w-4" /> 
                            <span>RC: {provider.rcNumber}</span>
                        </div>
                    )}
                    <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground pt-2 mt-2 border-t w-full">
                        <Badge variant="secondary">{provider.serviceType}</Badge>
                    </div>
                </div>
                 <div className="flex items-center justify-center gap-1 text-yellow-500 mt-4">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn('h-4 w-4', (provider.rating || 0) > i ? 'fill-current' : 'text-gray-300')} />
                    ))}
                     <span className="ml-1 text-xs text-muted-foreground">({provider.ratingCount || 0})</span>
                </div>
            </CardContent>
            <div className="p-6 pt-2">
              <Link href={`/services/${provider.id}`} passHref>
                <Button className="w-full">View Profile</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
       ) : (
          <div className="text-center py-16 text-muted-foreground">
              <Wrench className="mx-auto h-12 w-12" />
              <p className="mt-4">No service providers found for "{subCategory}" yet.</p>
          </div>
       )}
    </div>
  );
}
