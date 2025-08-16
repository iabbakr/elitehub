

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Lawyer } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BadgeCheck, Search, MapPin, Scale, Star, Crown, Gem, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchLawyers, nigerianStates } from '@/lib/data';
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


export default function FindLawyerPage() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');

  useEffect(() => {
    const getLawyers = async () => {
      const fetchedLawyers = await fetchLawyers();
      // Filter for active profiles based on subscription
      const now = new Date();
      const activeLawyers = fetchedLawyers.filter(lawyer => 
        lawyer.profileVisibleUntil && new Date(lawyer.profileVisibleUntil) > now
      );
      setLawyers(activeLawyers);
      setLoading(false);
    };
    getLawyers();
  }, []);

  const filteredLawyers = useMemo(() => {
    let filtered = [...lawyers];

    if (searchTerm) {
        filtered = filtered.filter(lawyer => 
            lawyer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lawyer.scn && lawyer.scn.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }

    if (selectedLocation !== 'all') {
        filtered = filtered.filter(lawyer =>
            lawyer.location === selectedLocation
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
  }, [lawyers, searchTerm, selectedLocation]);

  return (
    <div>
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground flex items-center justify-center gap-3">
          <Scale className="h-10 w-10 text-primary" />
          Find a Lawyer
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          Connect with verified legal professionals to ensure your transactions are secure and seamless.
        </p>
      </header>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
            <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Search by name or SCN..."
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
      ) : filteredLawyers.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredLawyers.map((lawyer) => (
          <Card key={lawyer.id} className="flex flex-col text-center hover:shadow-xl transition-shadow duration-300 rounded-xl">
            <CardHeader className="items-center">
              <div className="relative">
                <Image
                  src={lawyer.profileImage}
                  alt={`${lawyer.fullName} logo`}
                  width={80}
                  height={80}
                  className="rounded-full object-cover border-4 border-background outline outline-2 outline-border"
                />
                 {lawyer.tier === 'vvip' && (
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
                 {lawyer.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-background">
                      <BadgeCheck className="h-4 w-4" />
                  </div>
                )}
              </div>
              <CardTitle className="text-2xl font-headline mt-4 flex items-center justify-center gap-2">
                <span>{lawyer.fullName}</span>
                {lawyer.tier === 'vip' && <Crown className="h-6 w-6 text-yellow-500" />}
                {lawyer.tier === 'vvip' && <Gem className="h-6 w-6 text-purple-500" />}
              </CardTitle>
               <CardDescription className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
                <MapPin className="h-4 w-4" /> {lawyer.city}, {lawyer.location}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-center items-center">
                <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex items-center justify-center gap-2">
                         <Scale className="h-4 w-4" /> 
                         <span>SCN: {lawyer.scn}</span>
                    </div>
                     <div className="flex items-center justify-center gap-1 text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={cn('h-4 w-4', (lawyer.rating || 0) > i ? 'fill-current' : 'text-gray-300')} />
                        ))}
                         <span className="ml-1 text-xs text-muted-foreground">({lawyer.ratingCount || 0})</span>
                    </div>
                </div>
               <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground pt-4 mt-4 border-t w-full">
                {lawyer.practiceAreas.slice(0, 3).map(area => (
                    <Badge key={area} variant="secondary">{area}</Badge>
                ))}
                {lawyer.practiceAreas.length > 3 && <Badge variant="outline">...</Badge>}
              </div>
            </CardContent>
            <div className="p-6 pt-2">
              <Link href={`/lawyers/${lawyer.id}`} passHref>
                <Button className="w-full">View Profile</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
       ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Scale className="mx-auto h-12 w-12" />
            <p className="mt-4">No active lawyers found matching your criteria.</p>
          </div>
       )}
    </div>
  );
}
