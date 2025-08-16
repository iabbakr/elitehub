

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Vendor, Product } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Calendar, BadgeCheck, Briefcase, Search, Crown, Gem, FileCheck2, MapPin, Award } from 'lucide-react';
import { fetchVendors, productCategories, nigerianStates } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');


  useEffect(() => {
    const getVendorsAndProducts = async () => {
      const fetchedVendors = await fetchVendors();
      setVendors(fetchedVendors);
      setLoading(false);
    };
    getVendorsAndProducts();
  }, []);
  
  const getCategoryName = (categoryId: string) => {
    return productCategories.find(c => c.id === categoryId)?.name || categoryId;
  };

  const filteredVendors = useMemo(() => {
    let filtered = [...vendors];

    if (searchTerm) {
        filtered = filtered.filter(vendor => 
            vendor.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    if (selectedCategory !== 'all') {
        filtered = filtered.filter(vendor => 
            vendor.categories?.includes(selectedCategory)
        );
    }

    if (selectedLocation !== 'all') {
        filtered = filtered.filter(vendor =>
            vendor.location === selectedLocation
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
  }, [vendors, searchTerm, selectedCategory, selectedLocation]);

  return (
    <div>
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground">
          Our Trusted Vendors
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          Browse our community of verified vendors, each with a proven track record of quality and reliability.
        </p>
      </header>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
            <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Search for vendors..."
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
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {productCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
       </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredVendors.map((vendor) => (
          <Card key={vendor.id} className="flex flex-col text-center hover:shadow-xl transition-shadow duration-300 rounded-xl">
            <CardHeader className="items-center">
              <div className="relative">
                <Image
                  src={vendor.profileImage}
                  alt={`${vendor.name} logo`}
                  width={80}
                  height={80}
                  className="rounded-full object-cover border-4 border-background outline outline-2 outline-border"
                  data-ai-hint={vendor.dataAiHint}
                />
                 {vendor.tier === 'vvip' && (
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
                {vendor.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-background">
                    <BadgeCheck className="h-4 w-4" />
                  </div>
                )}
              </div>
              <CardTitle className="text-2xl font-headline mt-4 flex items-center justify-center gap-2">
                <span>{vendor.name}</span>
                 {vendor.tier === 'vip' && (
                    <Crown className="h-6 w-6 text-yellow-500" />
                )}
                {vendor.tier === 'vvip' && (
                    <Gem className="h-6 w-6 text-purple-500" />
                )}
              </CardTitle>
               <CardDescription className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
                <MapPin className="h-4 w-4" /> {vendor.city}, {vendor.location}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-center items-center">
                <div className="text-xs text-muted-foreground space-y-2">
                    <div className="flex items-center justify-center gap-2">
                         <Calendar className="h-4 w-4" /> 
                         <span>Member since {vendor.memberSince}</span>
                    </div>
                     {vendor.rcNumber && (
                        <div className="flex items-center justify-center gap-2">
                           <FileCheck2 className="h-4 w-4" />
                           <span>RC: {vendor.rcNumber}</span>
                        </div>
                    )}
                </div>
               <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground pt-4 mt-4 border-t w-full">
                {vendor.categories?.length > 0 ? (
                  vendor.categories.map(catId => (
                    <Badge key={catId} variant="secondary">{getCategoryName(catId)}</Badge>
                  ))
                ) : (
                  <Badge variant="secondary">General</Badge>
                )}
              </div>
            </CardContent>
            <div className="p-6 pt-2">
              <Link href={`/vendors/${vendor.id}`} passHref>
                <Button className="w-full">View Profile</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
