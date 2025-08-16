
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { fetchLogisticsCompanies, type LogisticsCompany } from '@/lib/data';
import { CheckCircle, XCircle, MoreHorizontal, Ban, Trash2, Check, ShieldCheck, Eye, Gem, Crown, Search, Mail, Phone, Truck, UserCheck } from 'lucide-react';
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


type KycReviewTarget = LogisticsCompany & { isApplication?: boolean };

export default function AllLogisticsPage() {
  const [logisticsCompanies, setLogisticsCompanies] = useState<LogisticsCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeBadges, setActiveBadges] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const [kycReviewModal, setKycReviewModal] = useState<{ isOpen: boolean; agent: KycReviewTarget | null }>({ isOpen: false, agent: null });

  const refreshData = async () => {
    setLoading(true);
    const fetchedLogistics = await fetchLogisticsCompanies();
    setLogisticsCompanies(fetchedLogistics);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const badgeStatus: Record<string, boolean> = {};
    const now = new Date();
    logisticsCompanies.forEach(provider => {
        if (provider.isVerified && provider.badgeExpirationDate) {
            badgeStatus[provider.id] = new Date(provider.badgeExpirationDate) > now;
        } else {
            badgeStatus[provider.id] = false;
        }
    });
    setActiveBadges(badgeStatus);
  }, [logisticsCompanies]);

    const handleKycDecision = async (decision: 'verified' | 'rejected') => {
        if (!kycReviewModal.agent) return;

        const agentRef = doc(db, 'logisticsCompanies', kycReviewModal.agent.id);
        
        try {
            await updateDoc(agentRef, { kycStatus: decision });
            toast({ title: 'KYC Status Updated', description: `${kycReviewModal.agent.name}'s KYC has been ${decision}.` });
            setKycReviewModal({ isOpen: false, agent: null });
            refreshData();
        } catch (error) {
            console.error("Error updating KYC status:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update KYC status.' });
        }
    };

  const handleProviderStatusChange = async (providerId: string, status: 'active' | 'banned') => {
    try {
        await updateDoc(doc(db, 'logisticsCompanies', providerId), { status });
        toast({ title: 'Status Updated', description: `Provider has been ${status}.` });
        refreshData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    }
  };
  
  const handleDeleteProvider = async (providerId: string) => {
    try {
        await deleteDoc(doc(db, 'logisticsCompanies', providerId));
        toast({ title: 'Provider Deleted' });
        refreshData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete provider.' });
    }
  };

  const handleManualBadgeAssign = async (providerId: string, durationMonths: number | null) => {
    const badgeExpirationDate = durationMonths ? add(new Date(), { months: durationMonths }).toISOString() : null;
    try {
        await updateDoc(doc(db, "logisticsCompanies", providerId), { isVerified: !!badgeExpirationDate, badgeExpirationDate: badgeExpirationDate });
        toast({ title: 'Badge Assigned', description: `Verification badge updated.` });
        refreshData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to assign badge.' });
    }
  };

  const handleManualTierAssign = async (providerId: string, tier: 'vip' | 'vvip' | null) => {
    try {
        await updateDoc(doc(db, "logisticsCompanies", providerId), { tier });
        toast({ title: `Tier Assigned`, description: `Provider has been set to ${tier || 'no tier'}.` });
        refreshData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: `Failed to assign tier.` });
    }
  };

  const handleEmailAll = () => {
    const emails = filteredLogistics.map(l => l.email).join(',');
    if (emails) {
      window.location.href = `mailto:${emails}`;
    } else {
      toast({ title: 'No companies to email' });
    }
  };
  
  const handleCopyAllPhones = () => {
    const phones = filteredLogistics.map(l => l.phoneNumber).join(', ');
    navigator.clipboard.writeText(phones);
    toast({ title: 'Phone Numbers Copied' });
  };

  const sortedLogistics = useMemo(() => logisticsCompanies.sort((a, b) => a.name.localeCompare(b.name)), [logisticsCompanies]);
  
  const filteredLogistics = useMemo(() => {
    return sortedLogistics.filter(l => {
        const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;
        
        switch(filter) {
            case 'vvip': return l.tier === 'vvip';
            case 'vip': return l.tier === 'vip';
            case 'verified': return l.isVerified && !l.tier;
            default: return true;
        }
    });
  }, [sortedLogistics, search, filter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-4">Loading Logistics Companies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Dialog open={kycReviewModal.isOpen} onOpenChange={(isOpen) => setKycReviewModal({ isOpen, agent: null })}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col"><DialogHeader><DialogTitle>KYC Document Review</DialogTitle><DialogDescription>Review the submitted documents for {kycReviewModal.agent?.name} ({kycReviewModal.agent?.email}).</DialogDescription></DialogHeader>
          <ScrollArea className="flex-grow">{kycReviewModal.agent && (<div className="space-y-4 p-4 pr-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label>ID Card (Front)</Label><Image src={kycReviewModal.agent.idCardFront!} alt="ID Card Front" width={400} height={250} className="rounded-md border object-contain w-full"/></div><div className="space-y-2"><Label>ID Card (Back)</Label><Image src={kycReviewModal.agent.idCardBack!} alt="ID Card Back" width={400} height={250} className="rounded-md border object-contain w-full"/></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label>Passport Photo</Label><Image src={kycReviewModal.agent.passportPhoto!} alt="Passport" width={200} height={200} className="rounded-md border object-contain w-full"/></div><div className="space-y-2"><Label>NIN</Label><p className="text-lg font-mono p-3 bg-muted rounded-md">{kycReviewModal.agent.nin}</p></div></div></div>)}</ScrollArea>
          <DialogFooter className="flex-shrink-0"><Button variant="destructive" onClick={() => handleKycDecision('rejected')}>Reject</Button><Button className="bg-green-600 hover:bg-green-700" onClick={() => handleKycDecision('verified')}>Approve KYC</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline tracking-tight text-foreground flex items-center gap-3"><Truck className="h-10 w-10 text-primary" />Logistics Management</h1>
        <p className="mt-2 text-lg text-muted-foreground">Oversee all registered logistics partners.</p>
      </header>

      <Card>
        <CardHeader><CardTitle>All Logistics Companies ({filteredLogistics.length})</CardTitle><CardDescription>Manage, view, and interact with all logistics companies.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
           <Tabs value={filter} onValueChange={setFilter}>
             <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="vvip">VVIP</TabsTrigger>
                <TabsTrigger value="vip">VIP</TabsTrigger>
                <TabsTrigger value="verified">Verified</TabsTrigger>
            </TabsList>
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search companies..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                <Button onClick={handleEmailAll}><Mail className="mr-2 h-4 w-4" />Email All Visible</Button>
                <Button onClick={handleCopyAllPhones} variant="outline"><Phone className="mr-2 h-4 w-4" />Copy All Phones</Button>
            </div>
            <div className="border rounded-md"><Table><TableHeader><TableRow><TableHead>Company</TableHead><TableHead>Status</TableHead><TableHead>Verification</TableHead><TableHead>KYC</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filteredLogistics.map((company) => (<TableRow key={company.id}><TableCell><div className="flex flex-col"><span>{company.name}</span><span className="text-xs text-muted-foreground">{company.email}</span></div></TableCell><TableCell><Badge variant={company.status === 'active' ? 'default' : 'destructive'}>{company.status}</Badge>{company.tier && (<Badge variant="secondary" className="ml-2 uppercase">{company.tier}</Badge>)}</TableCell><TableCell>{activeBadges[company.id] ? (<div className="flex items-center gap-2 text-green-600"><ShieldCheck className="h-5 w-5"/><span className="text-xs">Expires {new Date(company.badgeExpirationDate!).toLocaleDateString()}</span></div>) : (<span className="text-muted-foreground text-xs">Not Verified</span>)}</TableCell><TableCell><Badge variant={company.kycStatus === 'verified' ? 'default' : company.kycStatus === 'pending' ? 'secondary' : 'destructive'} className={cn(company.kycStatus === 'verified' && 'bg-green-100 text-green-800')}>{company.kycStatus || 'none'}</Badge></TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link href={`/logistics/${company.id}`}><Eye className="mr-2 h-4 w-4" /><span>View Profile</span></Link></DropdownMenuItem>{company.idCardFront && <DropdownMenuItem onClick={() => setKycReviewModal({ isOpen: true, agent: company })}><UserCheck className="mr-2 h-4 w-4" /><span>Review KYC</span></DropdownMenuItem>}<DropdownMenuSeparator /><DropdownMenuSub><DropdownMenuSubTrigger><ShieldCheck className="mr-2 h-4 w-4" /><span>Verification</span></DropdownMenuSubTrigger><DropdownMenuPortal><DropdownMenuSubContent><DropdownMenuItem onClick={() => handleManualBadgeAssign(company.id, 1)}>1 month</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualBadgeAssign(company.id, 6)}>6 months</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualBadgeAssign(company.id, 12)}>12 months</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-red-600" onClick={() => handleManualBadgeAssign(company.id, null)}>Remove</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuPortal></DropdownMenuSub><DropdownMenuSub><DropdownMenuSubTrigger><Gem className="mr-2 h-4 w-4" /><span>VIP/VVIP</span></DropdownMenuSubTrigger><DropdownMenuPortal><DropdownMenuSubContent><DropdownMenuItem onClick={() => handleManualTierAssign(company.id, 'vip')}><Crown className="mr-2 h-4 w-4" />Assign VIP</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualTierAssign(company.id, 'vvip')}><Gem className="mr-2 h-4 w-4" />Assign VVIP</DropdownMenuItem><DropdownMenuItem onClick={() => handleManualTierAssign(company.id, null)}><XCircle className="mr-2 h-4 w-4" /> Remove Tier</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuPortal></DropdownMenuSub><DropdownMenuSeparator />{company.status === 'active' ? (<DropdownMenuItem className="text-orange-600" onClick={() => handleProviderStatusChange(company.id, 'banned')}><Ban className="mr-2 h-4 w-4" />Ban</DropdownMenuItem>) : (<DropdownMenuItem className="text-green-600" onClick={() => handleProviderStatusChange(company.id, 'active')}><Check className="mr-2 h-4 w-4" />Unban</DropdownMenuItem>)}<DropdownMenuItem className="text-red-600" onClick={() => handleDeleteProvider(company.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody></Table></div>
           </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
