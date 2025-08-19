
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { fetchServiceProviders, type ServiceProvider } from '@/lib/data';
import { CheckCircle, XCircle, MoreHorizontal, Ban, Trash2, Check, ShieldCheck, Eye, Gem, Crown, Search, Mail, Phone, Wrench, UserCheck } from 'lucide-react';
import { add } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


type KycReviewTarget = ServiceProvider & { isApplication?: boolean };

export default function AllServicesPage() {
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeBadges, setActiveBadges] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const refreshData = async () => {
    setLoading(true);
    const fetchedServices = await fetchServiceProviders();
    setServiceProviders(fetchedServices);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const badgeStatus: Record<string, boolean> = {};
    const now = new Date();
    serviceProviders.forEach(provider => {
        if (provider.isVerified && provider.badgeExpirationDate) {
            badgeStatus[provider.id] = new Date(provider.badgeExpirationDate) > now;
        } else {
            badgeStatus[provider.id] = false;
        }
    });
    setActiveBadges(badgeStatus);
  }, [serviceProviders]);


  const handleProviderStatusChange = async (providerId: string, status: 'active' | 'banned') => {
    try {
        await updateDoc(doc(db, 'serviceProviders', providerId), { status });
        toast({ title: 'Status Updated', description: `Provider has been ${status}.` });
        refreshData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    }
  };
  
  const handleDeleteProvider = async (providerId: string) => {
    try {
        await deleteDoc(doc(db, 'serviceProviders', providerId));
        toast({ title: 'Provider Deleted' });
        refreshData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete provider.' });
    }
  };

  const handleManualBadgeAssign = async (providerId: string, durationMonths: number | null) => {
    const badgeExpirationDate = durationMonths ? add(new Date(), { months: durationMonths }).toISOString() : null;
    try {
        await updateDoc(doc(db, "serviceProviders", providerId), { isVerified: !!badgeExpirationDate, badgeExpirationDate: badgeExpirationDate });
        toast({ title: 'Badge Assigned', description: `Verification badge updated.` });
        refreshData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to assign badge.' });
    }
  };

  const handleManualProfileVisibilityAssign = async (providerId: string, durationMonths: number | null) => {
    const profileVisibleUntil = durationMonths ? add(new Date(), { months: durationMonths }).toISOString() : null;
    try {
        await updateDoc(doc(db, "serviceProviders", providerId), { profileVisibleUntil: profileVisibleUntil });
        toast({ title: 'Visibility Assigned', description: `Profile visibility updated.` });
        refreshData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to assign visibility.' });
    }
  };

  const handleManualTierAssign = async (providerId: string, tier: 'vip' | 'vvip' | null) => {
    try {
        await updateDoc(doc(db, "serviceProviders", providerId), { tier });
        toast({ title: `Tier Assigned`, description: `Provider has been set to ${tier || 'no tier'}.` });
        refreshData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: `Failed to assign tier.` });
    }
  };
  
  const sortedServices = useMemo(() => serviceProviders.sort((a, b) => a.businessName.localeCompare(b.businessName)), [serviceProviders]);
  
  const filteredServices = useMemo(() => {
    return sortedServices.filter(s => {
        const matchesSearch = s.businessName.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;
        
        switch(filter) {
            case 'vvip': return s.tier === 'vvip';
            case 'vip': return s.tier === 'vip';
            case 'verified': return s.isVerified && !s.tier;
            default: return true;
        }
    });
  }, [sortedServices, search, filter]);

  const handleEmailAll = () => {
    const emails = filteredServices.map(s => s.email).join(',');
    if (emails) {
      window.location.href = `mailto:${emails}`;
    } else {
      toast({ title: 'No providers to email' });
    }
  };
  
  const handleCopyAllPhones = () => {
    const phones = filteredServices.map(s => s.phoneNumber).join(', ');
    navigator.clipboard.writeText(phones);
    toast({ title: 'Phone Numbers Copied' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-4">Loading Service Providers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline tracking-tight text-foreground flex items-center gap-3"><Wrench className="h-10 w-10 text-primary" />Service Provider Management</h1>
        <p className="mt-2 text-lg text-muted-foreground">Oversee all registered service providers.</p>
      </header>

      <Card>
        <CardHeader><CardTitle>All Service Providers ({filteredServices.length})</CardTitle><CardDescription>Manage, view, and interact with all service providers.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={filter} onValueChange={setFilter}>
             <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="vvip">VVIP</TabsTrigger>
                <TabsTrigger value="vip">VIP</TabsTrigger>
                <TabsTrigger value="verified">Verified</TabsTrigger>
            </TabsList>
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search providers..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                <Button onClick={handleEmailAll}><Mail className="mr-2 h-4 w-4" />Email All Visible</Button>
                <Button onClick={handleCopyAllPhones} variant="outline"><Phone className="mr-2 h-4 w-4" />Copy All Phones</Button>
            </div>
            <div className="border rounded-md"><Table><TableHeader><TableRow><TableHead>Provider</TableHead><TableHead>Status</TableHead><TableHead>Verification</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filteredServices.map((provider) => (<TableRow key={provider.id}><TableCell><div className="flex flex-col"><span>{provider.businessName}</span><span className="text-xs text-muted-foreground">{provider.email}</span></div></TableCell><TableCell><Badge variant={provider.status === 'active' ? 'default' : 'destructive'}>{provider.status}</Badge>{provider.tier && (<Badge variant="secondary" className="ml-2 uppercase">{provider.tier}</Badge>)}</TableCell><TableCell>{activeBadges[provider.id] ? (<div className="flex items-center gap-2 text-green-600"><ShieldCheck className="h-5 w-5"/><span className="text-xs">Expires {new Date(provider.badgeExpirationDate!).toLocaleDateString()}</span></div>) : (<span className="text-muted-foreground text-xs">Not Verified</span>)}</TableCell><TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link href={`/services/${provider.id}`}><Eye className="mr-2 h-4 w-4" /><span>View Profile</span></Link></DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub><DropdownMenuSubTrigger><ShieldCheck className="mr-2 h-4 w-4" /><span>Verification</span></DropdownMenuSubTrigger><DropdownMenuPortal><DropdownMenuSubContent><DropdownMenuItem onClick={() => handleManualBadgeAssign(provider.id, 6)}>6 months</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualBadgeAssign(provider.id, 12)}>12 months</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-red-600" onClick={() => handleManualBadgeAssign(provider.id, null)}>Remove</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuPortal></DropdownMenuSub>
                        <DropdownMenuSub><DropdownMenuSubTrigger><Eye className="mr-2 h-4 w-4" /><span>Profile Visibility</span></DropdownMenuSubTrigger><DropdownMenuPortal><DropdownMenuSubContent><DropdownMenuItem onClick={() => handleManualProfileVisibilityAssign(provider.id, 3)}>3 months</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualProfileVisibilityAssign(provider.id, 6)}>6 months</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualProfileVisibilityAssign(provider.id, 12)}>12 months</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-red-600" onClick={() => handleManualProfileVisibilityAssign(provider.id, null)}>Remove</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuPortal></DropdownMenuSub>
                        <DropdownMenuSub><DropdownMenuSubTrigger><Gem className="mr-2 h-4 w-4" /><span>VIP/VVIP</span></DropdownMenuSubTrigger><DropdownMenuPortal><DropdownMenuSubContent><DropdownMenuItem onClick={() => handleManualTierAssign(provider.id, 'vip')}><Crown className="mr-2 h-4 w-4" />Assign VIP</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualTierAssign(provider.id, 'vvip')}><Gem className="mr-2 h-4 w-4" />Assign VVIP</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualTierAssign(provider.id, null)}><XCircle className="mr-2 h-4 w-4" /> Remove Tier</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuPortal></DropdownMenuSub>
                        <DropdownMenuSeparator />
                        {provider.status === 'active' ? (<DropdownMenuItem className="text-orange-600" onClick={() => handleProviderStatusChange(provider.id, 'banned')}><Ban className="mr-2 h-4 w-4" />Ban</DropdownMenuItem>) : (<DropdownMenuItem className="text-green-600" onClick={() => handleProviderStatusChange(provider.id, 'active')}><Check className="mr-2 h-4 w-4" />Unban</DropdownMenuItem>)}<DropdownMenuItem className="text-red-600" onClick={() => handleDeleteProvider(provider.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell></TableRow>))}</TableBody></Table></div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
