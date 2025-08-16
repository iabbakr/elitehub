
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { fetchCurrencyExchangeAgents, type CurrencyExchangeAgent } from '@/lib/data';
import { MoreHorizontal, Ban, Trash2, Check, ShieldCheck, Eye, Gem, Search, Mail, Phone, ArrowRightLeft, UserCheck } from 'lucide-react';
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


type KycReviewTarget = CurrencyExchangeAgent & { isApplication?: boolean };

export default function AllCurrencyExchangePage() {
  const [exchangeAgents, setExchangeAgents] = useState<CurrencyExchangeAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeBadges, setActiveBadges] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const [kycReviewModal, setKycReviewModal] = useState<{ isOpen: boolean; agent: KycReviewTarget | null }>({ isOpen: false, agent: null });

  const refreshData = async () => {
    setLoading(true);
    const fetchedAgents = await fetchCurrencyExchangeAgents();
    setExchangeAgents(fetchedAgents);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const badgeStatus: Record<string, boolean> = {};
    const now = new Date();
    exchangeAgents.forEach(provider => {
        if (provider.isVerified && provider.badgeExpirationDate) {
            badgeStatus[provider.id] = new Date(provider.badgeExpirationDate) > now;
        } else {
            badgeStatus[provider.id] = false;
        }
    });
    setActiveBadges(badgeStatus);
  }, [exchangeAgents]);

    const handleKycDecision = async (decision: 'verified' | 'rejected') => {
        if (!kycReviewModal.agent) return;

        const agentRef = doc(db, 'currencyExchangeAgents', kycReviewModal.agent.id);
        
        try {
            await updateDoc(agentRef, { kycStatus: decision });
            toast({ title: 'KYC Status Updated', description: `${kycReviewModal.agent.fullName}'s KYC has been ${decision}.` });
            setKycReviewModal({ isOpen: false, agent: null });
            refreshData();
        } catch (error) {
            console.error("Error updating KYC status:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update KYC status.' });
        }
    };

  const handleProviderStatusChange = async (providerId: string, status: 'active' | 'banned') => {
    try {
        await updateDoc(doc(db, 'currencyExchangeAgents', providerId), { status });
        toast({ title: 'Status Updated', description: `Provider has been ${status}.` });
        refreshData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    }
  };
  
  const handleDeleteProvider = async (providerId: string) => {
    try {
        await deleteDoc(doc(db, 'currencyExchangeAgents', providerId));
        toast({ title: 'Provider Deleted' });
        refreshData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete provider.' });
    }
  };

  const handleManualVvipAssignForExchange = async (agentId: string) => {
    const expirationDate = add(new Date(), { years: 1 }).toISOString();
    try {
      await updateDoc(doc(db, 'currencyExchangeAgents', agentId), {
        tier: 'vvip',
        isVerified: true,
        badgeExpirationDate: expirationDate,
        profileVisibleUntil: expirationDate,
      });
      toast({ title: 'VVIP Subscription Assigned', description: 'Agent has been manually upgraded to VVIP for 1 year.' });
      refreshData();
    } catch (error) {
      console.error('Error assigning VVIP:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to assign VVIP subscription.' });
    }
  };

  const sortedExchange = useMemo(() => exchangeAgents.sort((a, b) => a.businessName.localeCompare(b.businessName)), [exchangeAgents]);
  
  const filteredExchange = useMemo(() => {
    return sortedExchange.filter(e => {
        const matchesSearch = e.businessName.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        switch (filter) {
            case 'vvip': return e.tier === 'vvip';
            case 'vip': return e.tier === 'vip';
            case 'verified': return e.isVerified && !e.tier;
            default: return true;
        }
    });
  }, [sortedExchange, search, filter]);

  const handleEmailAll = () => {
    const emails = filteredExchange.map(e => e.email).join(',');
    if (emails) {
      window.location.href = `mailto:${emails}`;
    } else {
      toast({ title: 'No agents to email' });
    }
  };
  
  const handleCopyAllPhones = () => {
    const phones = filteredExchange.map(e => e.phoneNumber).join(', ');
    navigator.clipboard.writeText(phones);
    toast({ title: 'Phone Numbers Copied' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-4">Loading Exchange Agents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Dialog open={kycReviewModal.isOpen} onOpenChange={(isOpen) => setKycReviewModal({ isOpen, agent: null })}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col"><DialogHeader><DialogTitle>KYC Document Review</DialogTitle><DialogDescription>Review the submitted documents for {kycReviewModal.agent?.fullName} ({kycReviewModal.agent?.email}).</DialogDescription></DialogHeader>
          <ScrollArea className="flex-grow">{kycReviewModal.agent && (<div className="space-y-4 p-4 pr-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label>ID Card (Front)</Label><Image src={kycReviewModal.agent.idCardFront!} alt="ID Card Front" width={400} height={250} className="rounded-md border object-contain w-full"/></div><div className="space-y-2"><Label>ID Card (Back)</Label><Image src={kycReviewModal.agent.idCardBack!} alt="ID Card Back" width={400} height={250} className="rounded-md border object-contain w-full"/></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label>Passport Photo</Label><Image src={kycReviewModal.agent.passportPhoto!} alt="Passport" width={200} height={200} className="rounded-md border object-contain w-full"/></div><div className="space-y-2"><Label>NIN</Label><p className="text-lg font-mono p-3 bg-muted rounded-md">{kycReviewModal.agent.nin}</p></div></div></div>)}</ScrollArea>
          <DialogFooter className="flex-shrink-0"><Button variant="destructive" onClick={() => handleKycDecision('rejected')}>Reject</Button><Button className="bg-green-600 hover:bg-green-700" onClick={() => handleKycDecision('verified')}>Approve KYC</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline tracking-tight text-foreground flex items-center gap-3"><ArrowRightLeft className="h-10 w-10 text-primary" />Currency Exchange Management</h1>
        <p className="mt-2 text-lg text-muted-foreground">Oversee all registered currency exchange agents.</p>
      </header>

      <Card>
        <CardHeader><CardTitle>All Exchange Agents ({filteredExchange.length})</CardTitle><CardDescription>Manage, view, and interact with all currency exchange agents.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={filter} onValueChange={setFilter}>
             <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="vvip">VVIP</TabsTrigger>
                <TabsTrigger value="vip">VIP</TabsTrigger>
                <TabsTrigger value="verified">Verified</TabsTrigger>
            </TabsList>
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name or email..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                <Button onClick={handleEmailAll}><Mail className="mr-2 h-4 w-4" />Email All Visible</Button>
                <Button onClick={handleCopyAllPhones} variant="outline"><Phone className="mr-2 h-4 w-4" />Copy All Phones</Button>
            </div>
            <div className="border rounded-md"><Table><TableHeader><TableRow><TableHead>Agent</TableHead><TableHead>Status</TableHead><TableHead>Verification</TableHead><TableHead>KYC</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filteredExchange.map((agent) => (<TableRow key={agent.id}><TableCell><div className="flex flex-col"><span>{agent.businessName}</span><span className="text-xs text-muted-foreground">{agent.email}</span></div></TableCell><TableCell><Badge variant={agent.status === 'active' ? 'default' : 'destructive'}>{agent.status}</Badge>{agent.tier && (<Badge variant="secondary" className="ml-2 uppercase">{agent.tier}</Badge>)}</TableCell><TableCell>{activeBadges[agent.id] ? (<div className="flex items-center gap-2 text-green-600"><ShieldCheck className="h-5 w-5"/><span className="text-xs">Expires {new Date(agent.badgeExpirationDate!).toLocaleDateString()}</span></div>) : (<span className="text-muted-foreground text-xs">Not Verified</span>)}</TableCell>
            <TableCell><Badge variant={agent.kycStatus === 'verified' ? 'default' : agent.kycStatus === 'pending' ? 'secondary' : 'destructive'} className={cn(agent.kycStatus === 'verified' && 'bg-green-100 text-green-800')}>{agent.kycStatus || 'none'}</Badge></TableCell>
            <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link href={`/currency-exchange/${agent.id}`}><Eye className="mr-2 h-4 w-4" /><span>View Profile</span></Link></DropdownMenuItem>
                        {agent.idCardFront && <DropdownMenuItem onClick={() => setKycReviewModal({ isOpen: true, agent })}><UserCheck className="mr-2 h-4 w-4" /><span>Review KYC</span></DropdownMenuItem>}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleManualVvipAssignForExchange(agent.id)}><Gem className="mr-2 h-4 w-4" /><span>Manually Assign VVIP (1 Year)</span></DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {agent.status === 'active' ? (<DropdownMenuItem className="text-orange-600" onClick={() => handleProviderStatusChange(agent.id, 'banned')}><Ban className="mr-2 h-4 w-4" />Ban</DropdownMenuItem>) : (<DropdownMenuItem className="text-green-600" onClick={() => handleProviderStatusChange(agent.id, 'active')}><Check className="mr-2 h-4 w-4" />Unban</DropdownMenuItem>)}<DropdownMenuItem className="text-red-600" onClick={() => handleDeleteProvider(agent.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody></Table></div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
