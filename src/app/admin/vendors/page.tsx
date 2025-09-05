
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { fetchVendors, type Vendor } from '@/lib/data';
import { CheckCircle, XCircle, MoreHorizontal, Ban, Trash2, Check, ShieldCheck, Eye, Gem, Crown, Search, Mail, Phone, Package, UserCheck } from 'lucide-react';
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


type KycReviewTarget = Vendor & { isApplication?: boolean };

export default function AllVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeBadges, setActiveBadges] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const refreshData = async () => {
    setLoading(true);
    const fetchedVendors = await fetchVendors();
    setVendors(fetchedVendors);
    setLoading(false);
  };
  
  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const badgeStatus: Record<string, boolean> = {};
    const now = new Date();
    vendors.forEach(provider => {
        if (provider.isVerified && provider.badgeExpirationDate) {
            badgeStatus[provider.id] = new Date(provider.badgeExpirationDate) > now;
        } else {
            badgeStatus[provider.id] = false;
        }
    });
    setActiveBadges(badgeStatus);
  }, [vendors]);

  const handleProviderStatusChange = async (providerId: string, status: 'active' | 'banned') => {
    try {
        await updateDoc(doc(db, 'vendors', providerId), { status });
        toast({ title: 'Status Updated', description: `Provider has been ${status}.` });
        refreshData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    }
  };
  
  const handleDeleteProvider = async (providerId: string) => {
    try {
        await deleteDoc(doc(db, 'vendors', providerId));
        toast({ title: 'Provider Deleted' });
        refreshData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete provider.' });
    }
  };

  const handleManualBadgeAssign = async (providerId: string, durationMonths: number | null) => {
    const badgeExpirationDate = durationMonths ? add(new Date(), { months: durationMonths }).toISOString() : null;
    try {
        await updateDoc(doc(db, "vendors", providerId), { isVerified: !!badgeExpirationDate, badgeExpirationDate: badgeExpirationDate });
        toast({ title: 'Badge Assigned', description: `Verification badge updated.` });
        refreshData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to assign badge.' });
    }
  };

  const handleManualTierAssign = async (providerId: string, tier: 'vip' | 'vvip' | null) => {
    try {
        await updateDoc(doc(db, "vendors", providerId), { tier });
        toast({ title: `Tier Assigned`, description: `Provider has been set to ${tier || 'no tier'}.` });
        refreshData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: `Failed to assign tier.` });
    }
  };
  
  const handleManualPostLimitSet = async (vendorId: string, limit: number) => {
    try {
       await updateDoc(doc(db, "vendors", vendorId), { postLimit: limit });
       toast({ title: 'Post Limit Set', description: `Vendor post limit manually set.` });
       refreshData();
   } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to update post limit.' });
   }
 };

  const handleEmailAll = () => {
    const emails = filteredVendors.map(v => v.email).join(',');
    if (emails) {
      window.location.href = `mailto:${emails}`;
    } else {
      toast({ title: 'No vendors to email' });
    }
  };
  
  const handleCopyAllPhones = () => {
    const phones = filteredVendors.map(v => v.phoneNumber).join(', ');
    navigator.clipboard.writeText(phones);
    toast({ title: 'Phone Numbers Copied' });
  };

  const sortedVendors = useMemo(() => vendors.sort((a, b) => (a.name || '').localeCompare(b.name || '')), [vendors]);
  
  const filteredVendors = useMemo(() => {
    return sortedVendors.filter(v => {
        const matchesSearch = (v.name || '').toLowerCase().includes(search.toLowerCase()) || (v.email || '').toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;
        
        switch(filter) {
            case 'vvip': return v.tier === 'vvip';
            case 'vip': return v.tier === 'vip';
            case 'verified': return v.isVerified && !v.tier;
            default: return true;
        }
    });
  }, [sortedVendors, search, filter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-4">Loading Vendors...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight text-foreground flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />Vendor Management
        </h1>
        <p className="mt-1 text-lg text-muted-foreground">Oversee all vendors in the marketplace.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Vendors ({filteredVendors.length})</CardTitle>
          <CardDescription>Manage, view, and interact with all vendors on the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={filter} onValueChange={setFilter}>
             <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="vvip">VVIP</TabsTrigger>
                <TabsTrigger value="vip">VIP</TabsTrigger>
                <TabsTrigger value="verified">Verified</TabsTrigger>
            </TabsList>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name or email..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Button onClick={handleEmailAll}><Mail className="mr-2 h-4 w-4" />Email Visible</Button>
                <Button onClick={handleCopyAllPhones} variant="outline"><Phone className="mr-2 h-4 w-4" />Copy Phones</Button>
            </div>
            <div className="border rounded-md">
                <Table>
                <TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead className="hidden sm:table-cell">Status</TableHead><TableHead className="hidden md:table-cell">Posts</TableHead><TableHead className="hidden lg:table-cell">Verification</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                    {filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                        <TableCell className="font-medium"><div className="flex flex-col"><span>{vendor.name}</span><span className="text-xs text-muted-foreground">{vendor.email}</span></div></TableCell>
                        <TableCell className="hidden sm:table-cell"><Badge variant={vendor.status === 'active' ? 'default' : 'destructive'}>{vendor.status}</Badge>{vendor.tier && (<Badge variant="secondary" className="ml-2 uppercase">{vendor.tier}</Badge>)}</TableCell>
                        <TableCell className="hidden md:table-cell"><span className="text-sm">{vendor.postCount} / {vendor.postLimit === -1 ? 'Unlimited' : vendor.postLimit}</span></TableCell>
                        <TableCell className="hidden lg:table-cell">{activeBadges[vendor.id] ? (<div className="flex items-center gap-2 text-green-600"><ShieldCheck className="h-5 w-5"/><span className="text-xs">Expires {new Date(vendor.badgeExpirationDate!).toLocaleDateString()}</span></div>) : (<span className="text-muted-foreground text-xs">Not Verified</span>)}</TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild><Link href={`/admin/products/${vendor.id}`}><Eye className="mr-2 h-4 w-4" /><span>View Products</span></Link></DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub><DropdownMenuSubTrigger><ShieldCheck className="mr-2 h-4 w-4" /><span>Verification</span></DropdownMenuSubTrigger><DropdownMenuPortal><DropdownMenuSubContent><DropdownMenuItem onClick={() => handleManualBadgeAssign(vendor.id, 3)}>3 months</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualBadgeAssign(vendor.id, 6)}>6 months</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualBadgeAssign(vendor.id, 12)}>12 months</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-red-600" onClick={() => handleManualBadgeAssign(vendor.id, null)}>Remove</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuPortal></DropdownMenuSub>
                            <DropdownMenuSub><DropdownMenuSubTrigger><Gem className="mr-2 h-4 w-4" /><span>VIP/VVIP</span></DropdownMenuSubTrigger><DropdownMenuPortal><DropdownMenuSubContent><DropdownMenuItem onClick={() => handleManualTierAssign(vendor.id, 'vip')}><Crown className="mr-2 h-4 w-4" />Assign VIP</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualTierAssign(vendor.id, 'vvip')}><Gem className="mr-2 h-4 w-4" />Assign VVIP</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualTierAssign(vendor.id, null)}><XCircle className="mr-2 h-4 w-4" />Remove</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuPortal></DropdownMenuSub>
                            <DropdownMenuSub><DropdownMenuSubTrigger><Eye className="mr-2 h-4 w-4" /><span>Post Limit</span></DropdownMenuSubTrigger><DropdownMenuPortal><DropdownMenuSubContent><DropdownMenuItem onClick={() => handleManualPostLimitSet(vendor.id, 5)}>Set to 5</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualPostLimitSet(vendor.id, 20)}>Set to 20</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualPostLimitSet(vendor.id, 50)}>Set to 50</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualPostLimitSet(vendor.id, 100)}>Set to 100</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualPostLimitSet(vendor.id, -1)}>Set to Unlimited</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuPortal></DropdownMenuSub>
                            <DropdownMenuSeparator />
                            {vendor.status === 'active' ? (<DropdownMenuItem className="text-orange-600" onClick={() => handleProviderStatusChange(vendor.id, 'banned')}><Ban className="mr-2 h-4 w-4" />Ban</DropdownMenuItem>) : (<DropdownMenuItem className="text-green-600" onClick={() => handleProviderStatusChange(vendor.id, 'active')}><Check className="mr-2 h-4 w-4" />Unban</DropdownMenuItem>)}
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteProvider(vendor.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
