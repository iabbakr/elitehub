

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Package, Scale, ArrowRightLeft, Truck, Wrench, Clock, CheckCircle, XCircle, Mail, UserCheck, Edit } from 'lucide-react';
import { 
    fetchPendingApplications, fetchVendors, type VendorApplication, type Vendor, 
    fetchPendingLawyerApplications, type LawyerApplication, type Lawyer, 
    fetchPendingCurrencyExchangeApplications, type CurrencyExchangeApplication, type CurrencyExchangeAgent, 
    fetchPendingLogisticsApplications, type LogisticsApplication, type LogisticsCompany, 
    fetchPendingServiceApplications, type ServiceProviderApplication, type ServiceProvider, 
    fetchLawyers, fetchLogisticsCompanies, fetchCurrencyExchangeAgents, fetchServiceProviders, 
    fetchUsers, type UserData, nigerianStates, fetchPendingProfileUpdates, type ProfileUpdateRequest,
} from '@/lib/data';
import { getCountFromServer, collection, writeBatch, doc, serverTimestamp, getDocs, where, query, increment, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { add } from 'date-fns';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { sendApprovalEmail } from '@/lib/email';
import { approveApplicationAction } from '@/app/actions/adminActions';

const referralTiers = [
    { count: 10, reward: '10 posts' },
    { count: 50, reward: 'verified badge' },
    { count: 100, reward: 'vip status' },
    { count: 150, reward: 'vvip status' },
];

type AnyApplication = VendorApplication | LawyerApplication | CurrencyExchangeApplication | LogisticsApplication | ServiceProviderApplication;

export default function AdminDashboardPage() {
  const { toast } = useToast();
  
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [lawyerApplications, setLawyerApplications] = useState<LawyerApplication[]>([]);
  const [exchangeApplications, setExchangeApplications] = useState<CurrencyExchangeApplication[]>([]);
  const [logisticsApplications, setLogisticsApplications] = useState<LogisticsApplication[]>([]);
  const [serviceApplications, setServiceApplications] = useState<ServiceProviderApplication[]>([]);
  const [updateRequests, setUpdateRequests] = useState<ProfileUpdateRequest[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [allLawyers, setAllLawyers] = useState<Lawyer[]>([]);
  const [allLogistics, setAllLogistics] = useState<LogisticsCompany[]>([]);
  const [allExchange, setAllExchange] = useState<CurrencyExchangeAgent[]>([]);
  const [allServices, setAllServices] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);

  const [locationFilter, setLocationFilter] = useState('all');

  const refreshData = async () => {
    setLoading(true);
    try {
      const [
        fetchedApplications, fetchedLawyerApplications, fetchedExchangeApplications, fetchedLogisticsApplications, fetchedServiceApplications,
        fetchedVendors, fetchedLawyers, fetchedLogistics, fetchedExchange, fetchedServices,
        fetchedUsers, fetchedUpdateRequests
      ] = await Promise.all([
        fetchPendingApplications(), fetchPendingLawyerApplications(), fetchPendingCurrencyExchangeApplications(), fetchPendingLogisticsApplications(), fetchPendingServiceApplications(),
        fetchVendors(), fetchLawyers(), fetchLogisticsCompanies(), fetchCurrencyExchangeAgents(), fetchServiceProviders(),
        fetchUsers(), fetchPendingProfileUpdates()
      ]);

      setApplications(fetchedApplications);
      setLawyerApplications(fetchedLawyerApplications);
      setExchangeApplications(fetchedExchangeApplications);
      setLogisticsApplications(fetchedLogisticsApplications);
      setServiceApplications(fetchedServiceApplications);
      setAllVendors(fetchedVendors);
      setAllLawyers(fetchedLawyers);
      setAllLogistics(fetchedLogistics);
      setAllExchange(fetchedExchange);
      setAllServices(fetchedServices);
      setAllUsers(fetchedUsers);
      setUpdateRequests(fetchedUpdateRequests);

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load dashboard data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredData = useMemo(() => {
    if (locationFilter === 'all') {
      return { vendors: allVendors, lawyers: allLawyers, logistics: allLogistics, exchange: allExchange, services: allServices };
    }
    return {
      vendors: allVendors.filter(v => v.location === locationFilter),
      lawyers: allLawyers.filter(l => l.location === locationFilter),
      logistics: allLogistics.filter(l => l.location === locationFilter),
      exchange: allExchange.filter(e => e.location === locationFilter),
      services: allServices.filter(s => s.location === locationFilter),
    };
  }, [locationFilter, allUsers, allVendors, allLawyers, allLogistics, allExchange, allServices]);

  const stats = useMemo(() => ({
    totalUsers: allUsers.length,
    totalVendors: filteredData.vendors.length,
    totalLawyers: filteredData.lawyers.length,
    totalLogistics: filteredData.logistics.length,
    totalExchange: filteredData.exchange.length,
    totalServices: filteredData.services.length,
    pendingVendors: applications.length,
    pendingLawyers: lawyerApplications.length,
    pendingLogistics: logisticsApplications.length,
    pendingExchange: exchangeApplications.length,
    pendingServices: serviceApplications.length,
    pendingUpdates: updateRequests.length,
  }), [filteredData, applications, lawyerApplications, exchangeApplications, logisticsApplications, serviceApplications, allUsers, updateRequests]);
  
  const handleApplicationDecision = async (appId: string, appType: 'vendor' | 'lawyer' | 'logistics' | 'service' | 'currency-exchange', appEmail: string, appName: string) => {
    try {
        await approveApplicationAction({ appId, appType });
        // Assume profile URL can be constructed - this might need adjustment if IDs are not predictable
        // For now, we direct to a generic success page or the main category page.
        const profileUrl = `https://www.elitehubng.com/${appType}s`; 
        await sendApprovalEmail(appEmail, appName, appType, profileUrl);
        
        toast({ title: 'Application Approved', description: `${appName} is now a registered ${appType}.` });
        refreshData();
    } catch (error: any) {
        console.error("Error approving application:", error);
        toast({ variant: 'destructive', title: 'Approval Failed', description: error.message || 'Could not approve application.' });
    }
  };

  const handleUpdateDecision = async (req: ProfileUpdateRequest, decision: 'approved' | 'rejected') => {
    const targetCollection = req.providerType + 's';
    const requestCollection = req.providerType + 'ProfileUpdateRequests';
    const providerRef = doc(db, targetCollection, req.providerId);
    const requestRef = doc(db, requestCollection, req.id);
    
    try {
        const batch = writeBatch(db);
        if (decision === 'approved') {
            batch.update(providerRef, { ...req.data, profileUpdateStatus: 'approved' });
        } else {
            batch.update(providerRef, { profileUpdateStatus: 'rejected' });
        }
        batch.delete(requestRef);
        await batch.commit();

        toast({ title: 'Update Request Handled', description: `Request has been ${decision}.` });
        refreshData();
    } catch (error) {
        console.error("Error handling update request:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to handle update request.' });
    }
  };


  const handleRejection = async (appId: string, collectionName: string, name: string) => {
    const appRef = doc(db, collectionName, appId);
    await writeBatch(db).update(appRef, { status: 'rejected' }).commit();
    toast({ title: 'Application Rejected', description: `Application for ${name} has been rejected.` });
    refreshData();
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight text-foreground">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">
            Oversee and manage all platform activities.
          </p>
        </div>
         <div className="w-full md:w-64">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
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
      </header>

      <section>
        <h2 className="text-2xl font-bold font-headline mb-4">Platform Analytics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users />Users</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.totalUsers}</p></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Package />Vendors</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.totalVendors}</p><p className="text-xs text-muted-foreground">{stats.pendingVendors} pending</p></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Scale />Lawyers</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.totalLawyers}</p><p className="text-xs text-muted-foreground">{stats.pendingLawyers} pending</p></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Truck />Logistics</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.totalLogistics}</p><p className="text-xs text-muted-foreground">{stats.pendingLogistics} pending</p></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><ArrowRightLeft />Currency Exchange</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.totalExchange}</p><p className="text-xs text-muted-foreground">{stats.pendingExchange} pending</p></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Wrench />Service Providers</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.totalServices}</p><p className="text-xs text-muted-foreground">{stats.pendingServices} pending</p></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Edit />Profile Updates</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.pendingUpdates}</p><p className="text-xs text-muted-foreground">pending review</p></CardContent></Card>
        </div>
      </section>

      <div className="space-y-6 md:space-y-8">
            <Card className="shadow-lg">
                <CardHeader><CardTitle>Pending Profile Update Requests</CardTitle><CardDescription>{updateRequests.length > 0 ? `There are ${updateRequests.length} update requests awaiting review.` : 'No pending update requests.'}</CardDescription></CardHeader>
                <CardContent><div className="border rounded-md"><Table><TableHeader><TableRow><TableHead>Provider</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
                {updateRequests.length > 0 ? updateRequests.map((req) => (
                    <TableRow key={req.id}>
                        <TableCell className="font-medium">{(req.data as any).name || (req.data as any).fullName}</TableCell>
                        <TableCell>{req.providerType}</TableCell>
                        <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleUpdateDecision(req, 'approved')} className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleUpdateDecision(req, 'rejected')}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                        </TableCell>
                    </TableRow>
                )) : <TableRow><TableCell colSpan={3} className="text-center h-24">All caught up!</TableCell></TableRow>}
                </TableBody></Table></div></CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader><CardTitle>Pending Vendor Applications</CardTitle><CardDescription>{applications.length > 0 ? `There are ${applications.length} applications awaiting review.` : 'No pending applications.'}</CardDescription></CardHeader>
                <CardContent><div className="border rounded-md"><Table><TableHeader><TableRow><TableHead>Vendor Name</TableHead><TableHead className="hidden sm:table-cell">Email</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
                {applications.length > 0 ? applications.map((app) => (
                    <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.vendorName}</TableCell><TableCell className="hidden sm:table-cell">{app.email}</TableCell>
                        <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleApplicationDecision(app.id, 'vendor', app.email, app.vendorName)} className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleRejection(app.id, 'vendorApplications', app.vendorName)}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                        </TableCell>
                    </TableRow>
                )) : <TableRow><TableCell colSpan={3} className="text-center h-24">All caught up!</TableCell></TableRow>}
                </TableBody></Table></div></CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader><CardTitle className="flex items-center gap-2"><Scale /> Pending Lawyer Applications</CardTitle><CardDescription>{lawyerApplications.length > 0 ? `There are ${lawyerApplications.length} lawyer applications awaiting review.` : 'No pending lawyer applications.'}</CardDescription></CardHeader>
                <CardContent><div className="border rounded-md"><Table><TableHeader><TableRow><TableHead>Applicant Name</TableHead><TableHead className="hidden sm:table-cell">SCN</TableHead><TableHead className="hidden md:table-cell">Location</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
                {lawyerApplications.length > 0 ? lawyerApplications.map((app) => (
                    <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.fullName}</TableCell><TableCell className="hidden sm:table-cell">{app.scn}</TableCell><TableCell className="hidden md:table-cell">{app.location}</TableCell>
                        <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleApplicationDecision(app.id, 'lawyer', app.email, app.fullName)} className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleRejection(app.id, 'lawyerApplications', app.fullName)}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                        </TableCell>
                    </TableRow>
                )) : <TableRow><TableCell colSpan={4} className="text-center h-24">All caught up!</TableCell></TableRow>}
                </TableBody></Table></div></CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader><CardTitle className="flex items-center gap-2"><ArrowRightLeft /> Pending Currency Exchange Applications</CardTitle><CardDescription>{exchangeApplications.length > 0 ? `There are ${exchangeApplications.length} applications awaiting review.` : 'No pending currency exchange applications.'}</CardDescription></CardHeader>
                <CardContent><div className="border rounded-md"><Table><TableHeader><TableRow><TableHead>Business Name</TableHead><TableHead className="hidden md:table-cell">Location</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
                {exchangeApplications.length > 0 ? exchangeApplications.map((app) => (
                    <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.businessName}</TableCell><TableCell className="hidden md:table-cell">{app.location}</TableCell>
                        <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleApplicationDecision(app.id, 'currency-exchange', app.email, app.businessName)} className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleRejection(app.id, 'currencyExchangeApplications', app.businessName)}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                        </TableCell>
                    </TableRow>
                )) : <TableRow><TableCell colSpan={3} className="text-center h-24">All caught up!</TableCell></TableRow>}
                </TableBody></Table></div></CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader><CardTitle className="flex items-center gap-2"><Truck /> Pending Logistics Applications</CardTitle><CardDescription>{logisticsApplications.length > 0 ? `There are ${logisticsApplications.length} applications awaiting review.` : 'No pending logistics applications.'}</CardDescription></CardHeader>
                <CardContent><div className="border rounded-md"><Table><TableHeader><TableRow><TableHead>Company Name</TableHead><TableHead className="hidden sm:table-cell">Category</TableHead><TableHead className="hidden md:table-cell">Location</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
                {logisticsApplications.length > 0 ? logisticsApplications.map((app) => (
                    <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.name}</TableCell><TableCell className="hidden sm:table-cell">{app.category || 'N/A'}</TableCell><TableCell className="hidden md:table-cell">{app.location}</TableCell>
                        <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleApplicationDecision(app.id, 'logistics', app.email, app.name)} className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleRejection(app.id, 'logisticsApplications', app.name)}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                        </TableCell>
                    </TableRow>
                )) : <TableRow><TableCell colSpan={4} className="text-center h-24">All caught up!</TableCell></TableRow>}
                </TableBody></Table></div></CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader><CardTitle className="flex items-center gap-2"><Wrench /> Pending Service Provider Applications</CardTitle><CardDescription>{serviceApplications.length > 0 ? `There are ${serviceApplications.length} applications awaiting review.` : 'No pending service provider applications.'}</CardDescription></CardHeader>
                <CardContent><div className="border rounded-md"><Table><TableHeader><TableRow><TableHead>Business Name</TableHead><TableHead className="hidden sm:table-cell">Service</TableHead><TableHead className="hidden md:table-cell">Location</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
                {serviceApplications.length > 0 ? serviceApplications.map((app) => (
                    <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.businessName}</TableCell><TableCell className="hidden sm:table-cell">{app.serviceType}</TableCell><TableCell className="hidden md:table-cell">{app.location}</TableCell>
                        <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleApplicationDecision(app.id, 'service', app.email, app.businessName)} className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleRejection(app.id, 'serviceProviderApplications', app.businessName)}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                        </TableCell>
                    </TableRow>
                )) : <TableRow><TableCell colSpan={4} className="text-center h-24">All caught up!</TableCell></TableRow>}
                </TableBody></Table></div></CardContent>
            </Card>
      </div>
    </div>
  );
}
