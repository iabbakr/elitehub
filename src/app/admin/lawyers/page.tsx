
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { fetchLawyers, type Lawyer } from '@/lib/data';
import { CheckCircle, XCircle, MoreHorizontal, Ban, Trash2, Check, ShieldCheck, Eye, Gem, Crown, Search, Mail, Phone, Scale, UserCheck } from 'lucide-react';
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


type KycReviewTarget = Lawyer & { isApplication?: boolean };

export default function AllLawyersPage() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeBadges, setActiveBadges] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const refreshData = async () => {
    setLoading(true);
    const fetchedLawyers = await fetchLawyers();
    setLawyers(fetchedLawyers);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const badgeStatus: Record<string, boolean> = {};
    const now = new Date();
    lawyers.forEach(provider => {
        if (provider.isVerified && provider.badgeExpirationDate) {
            badgeStatus[provider.id] = new Date(provider.badgeExpirationDate) > now;
        } else {
            badgeStatus[provider.id] = false;
        }
    });
    setActiveBadges(badgeStatus);
  }, [lawyers]);


  const handleProviderStatusChange = async (providerId: string, status: 'active' | 'banned') => {
    try {
        await updateDoc(doc(db, 'lawyers', providerId), { status });
        toast({ title: 'Status Updated', description: `Provider has been ${status}.` });
        refreshData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    }
  };
  
  const handleDeleteProvider = async (providerId: string) => {
    try {
        await deleteDoc(doc(db, 'lawyers', providerId));
        toast({ title: 'Provider Deleted' });
        refreshData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete provider.' });
    }
  };

  const handleManualBadgeAssign = async (providerId: string, durationMonths: number | null) => {
    const badgeExpirationDate = durationMonths ? add(new Date(), { months: durationMonths }).toISOString() : null;
    try {
        await updateDoc(doc(db, "lawyers", providerId), { isVerified: !!badgeExpirationDate, badgeExpirationDate: badgeExpirationDate });
        toast({ title: 'Badge Assigned', description: `Verification badge updated.` });
        refreshData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to assign badge.' });
    }
  };

  const handleManualProfileVisibilityAssign = async (providerId: string, durationMonths: number | null) => {
    const profileVisibleUntil = durationMonths ? add(new Date(), { months: durationMonths }).toISOString() : null;
    try {
        await updateDoc(doc(db, "lawyers", providerId), { profileVisibleUntil: profileVisibleUntil });
        toast({ title: 'Visibility Assigned', description: `Profile visibility updated.` });
        refreshData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to assign visibility.' });
    }
  };

  const handleManualTierAssign = async (providerId: string, tier: 'vip' | 'vvip' | null) => {
    try {
        await updateDoc(doc(db, "lawyers", providerId), { tier });
        toast({ title: `Tier Assigned`, description: `Provider has been set to ${tier || 'no tier'}.` });
        refreshData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: `Failed to assign tier.` });
    }
  };

  const handleEmailAll = () => {
    const emails = filteredLawyers.map(l => l.email).join(',');
    if (emails) {
      window.location.href = `mailto:${emails}`;
    } else {
      toast({ title: 'No lawyers to email' });
    }
  };
  
  const handleCopyAllPhones = () => {
    const phones = filteredLawyers.map(l => l.phoneNumber).join(', ');
    navigator.clipboard.writeText(phones);
    toast({ title: 'Phone Numbers Copied' });
  };
  
  const sortedLawyers = useMemo(() => lawyers.sort((a, b) => a.fullName.localeCompare(b.fullName)), [lawyers]);
  
  const filteredLawyers = useMemo(() => {
    const now = new Date();
    return sortedLawyers.filter(l => {
        const matchesSearch = l.fullName.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        switch (filter) {
            case 'vvip': return l.tier === 'vvip';
            case 'vip': return l.tier === 'vip';
            case 'verified': return l.isVerified && !l.tier;
            case 'active-profiles': return l.profileVisibleUntil && new Date(l.profileVisibleUntil) > now;
            default: return true;
        }
    });
  }, [sortedLawyers, search, filter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-4">Loading Lawyers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline tracking-tight text-foreground flex items-center gap-3"><Scale className="h-10 w-10 text-primary" />Lawyer Management</h1>
        <p className="mt-2 text-lg text-muted-foreground">Oversee all registered legal professionals.</p>
      </header>

      <Card>
        <CardHeader><CardTitle>All Lawyers ({filteredLawyers.length})</CardTitle><CardDescription>Manage, view, and interact with all lawyers on the platform.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={filter} onValueChange={setFilter}>
             <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active-profiles">Active Profiles</TabsTrigger>
                <TabsTrigger value="vvip">VVIP</TabsTrigger>
                <TabsTrigger value="vip">VIP</TabsTrigger>
                <TabsTrigger value="verified">Verified</TabsTrigger>
            </TabsList>
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name or email..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                <Button onClick={handleEmailAll}><Mail className="mr-2 h-4 w-4" />Email All Visible</Button>
                <Button onClick={handleCopyAllPhones} variant="outline"><Phone className="mr-2 h-4 w-4" />Copy All Phones</Button>
            </div>
            <div className="border rounded-md"><Table><TableHeader><TableRow><TableHead>Lawyer</TableHead><TableHead>Status</TableHead><TableHead>Verification</TableHead><TableHead>Profile Active</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filteredLawyers.map((lawyer) => (<TableRow key={lawyer.id}><TableCell><div className="flex flex-col"><span>{lawyer.fullName}</span><span className="text-xs text-muted-foreground">{lawyer.email}</span></div></TableCell><TableCell><Badge variant={lawyer.status === 'active' ? 'default' : 'destructive'}>{lawyer.status}</Badge>{lawyer.tier && (<Badge variant="secondary" className="ml-2 uppercase">{lawyer.tier}</Badge>)}</TableCell><TableCell>{activeBadges[lawyer.id] ? (<div className="flex items-center gap-2 text-green-600"><ShieldCheck className="h-5 w-5"/><span className="text-xs">Expires {new Date(lawyer.badgeExpirationDate!).toLocaleDateString()}</span></div>) : (<span className="text-muted-foreground text-xs">Not Verified</span>)}</TableCell><TableCell>{lawyer.profileVisibleUntil && new Date(lawyer.profileVisibleUntil) > new Date() ? <span className="text-green-600 text-xs">Yes</span> : <span className="text-red-600 text-xs">No</span>}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link href={`/lawyers/${lawyer.id}`}><Eye className="mr-2 h-4 w-4" /><span>View Profile</span></Link></DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuSub><DropdownMenuSubTrigger><ShieldCheck className="mr-2 h-4 w-4" /><span>Verification</span></DropdownMenuSubTrigger><DropdownMenuPortal><DropdownMenuSubContent><DropdownMenuItem onClick={() => handleManualBadgeAssign(lawyer.id, 6)}>6 months</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualBadgeAssign(lawyer.id, 12)}>12 months</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-red-600" onClick={() => handleManualBadgeAssign(lawyer.id, null)}>Remove</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuPortal></DropdownMenuSub><DropdownMenuSub><DropdownMenuSubTrigger><Eye className="mr-2 h-4 w-4" /><span>Profile Visibility</span></DropdownMenuSubTrigger><DropdownMenuPortal><DropdownMenuSubContent><DropdownMenuItem onClick={() => handleManualProfileVisibilityAssign(lawyer.id, 6)}>6 months</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualProfileVisibilityAssign(lawyer.id, 12)}>12 months</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-red-600" onClick={() => handleManualProfileVisibilityAssign(lawyer.id, null)}>Remove</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuPortal></DropdownMenuSub><DropdownMenuSub><DropdownMenuSubTrigger><Gem className="mr-2 h-4 w-4" /><span>VIP/VVIP</span></DropdownMenuSubTrigger><DropdownMenuPortal><DropdownMenuSubContent><DropdownMenuItem onClick={() => handleManualTierAssign(lawyer.id, 'vip')}><Crown className="mr-2 h-4 w-4" />Assign VIP</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualTierAssign(lawyer.id, 'vvip')}><Gem className="mr-2 h-4 w-4" />Assign VVIP</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualTierAssign(lawyer.id, null)}><XCircle className="mr-2 h-4 w-4" /> Remove Tier</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuPortal></DropdownMenuSub><DropdownMenuSeparator />{lawyer.status === 'active' ? (<DropdownMenuItem className="text-orange-600" onClick={() => handleProviderStatusChange(lawyer.id, 'banned')}><Ban className="mr-2 h-4 w-4" />Ban</DropdownMenuItem>) : (<DropdownMenuItem className="text-green-600" onClick={() => handleProviderStatusChange(lawyer.id, 'active')}><Check className="mr-2 h-4 w-4" />Unban</DropdownMenuItem>)}<DropdownMenuItem className="text-red-600" onClick={() => handleDeleteProvider(lawyer.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody></Table></div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
