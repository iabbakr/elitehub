

'use client';

import React, { useState, useEffect } from 'react';
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
import { Loader2, Users, Package, Scale, ArrowRightLeft, Truck, Wrench, Clock, CheckCircle, XCircle, Mail, UserCheck } from 'lucide-react';
import { fetchPendingApplications, fetchVendors, type VendorApplication, type Vendor, fetchPendingLawyerApplications, type LawyerApplication, type Lawyer, fetchPendingCurrencyExchangeApplications, type CurrencyExchangeApplication, type CurrencyExchangeAgent, fetchPendingLogisticsApplications, type LogisticsApplication, type LogisticsCompany, fetchPendingServiceApplications, type ServiceProviderApplication, type ServiceProvider, fetchLawyers, fetchLogisticsCompanies, fetchCurrencyExchangeAgents, fetchServiceProviders, fetchUsers, type UserData, createNotification } from '@/lib/data';
import { getCountFromServer, collection, writeBatch, doc, serverTimestamp, getDocs, where, query, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { add } from 'date-fns';

const referralTiers = [
    { count: 10, reward: '10 posts' },
    { count: 50, reward: 'verified badge' },
    { count: 100, reward: 'vip status' },
    { count: 150, reward: 'vvip status' },
];

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // State for pending applications
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [lawyerApplications, setLawyerApplications] = useState<LawyerApplication[]>([]);
  const [exchangeApplications, setExchangeApplications] = useState<CurrencyExchangeApplication[]>([]);
  const [logisticsApplications, setLogisticsApplications] = useState<LogisticsApplication[]>([]);
  const [serviceApplications, setServiceApplications] = useState<ServiceProviderApplication[]>([]);

  // State for counts
  const [counts, setCounts] = useState({
    users: 0,
    vendors: 0,
    products: 0,
    lawyers: 0,
    logistics: 0,
    exchange: 0,
    services: 0,
    pendingVendors: 0,
    pendingLawyers: 0,
    pendingLogistics: 0,
    pendingExchange: 0,
    pendingServices: 0,
  });

  const refreshData = async () => {
    setLoading(true);
    try {
      const [
        fetchedApplications,
        fetchedLawyerApplications,
        fetchedExchangeApplications,
        fetchedLogisticsApplications,
        fetchedServiceApplications,
        usersCount,
        vendorsCount,
        productsCount,
        lawyersCount,
        logisticsCount,
        exchangeCount,
        servicesCount,
      ] = await Promise.all([
        fetchPendingApplications(),
        fetchPendingLawyerApplications(),
        fetchPendingCurrencyExchangeApplications(),
        fetchPendingLogisticsApplications(),
        fetchPendingServiceApplications(),
        getCountFromServer(collection(db, "users")),
        getCountFromServer(collection(db, "vendors")),
        getCountFromServer(collection(db, "products")),
        getCountFromServer(collection(db, "lawyers")),
        getCountFromServer(collection(db, "logisticsCompanies")),
        getCountFromServer(collection(db, "currencyExchangeAgents")),
        getCountFromServer(collection(db, "serviceProviders")),
      ]);

      setApplications(fetchedApplications);
      setLawyerApplications(fetchedLawyerApplications);
      setExchangeApplications(fetchedExchangeApplications);
      setLogisticsApplications(fetchedLogisticsApplications);
      setServiceApplications(fetchedServiceApplications);

      setCounts({
        users: usersCount.data().count,
        vendors: vendorsCount.data().count,
        products: productsCount.data().count,
        lawyers: lawyersCount.data().count,
        logistics: logisticsCount.data().count,
        exchange: exchangeCount.data().count,
        services: servicesCount.data().count,
        pendingVendors: fetchedApplications.length,
        pendingLawyers: fetchedLawyerApplications.length,
        pendingLogistics: fetchedLogisticsApplications.length,
        pendingExchange: fetchedExchangeApplications.length,
        pendingServices: fetchedServiceApplications.length,
      });

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
  
  const handleApplicationDecision = async (app: any, collectionName: string, targetCollection: string, newProviderData: any, providerType: string) => {
    const appRef = doc(db, collectionName, app.id);
    const batch = writeBatch(db);
    batch.update(appRef, { status: 'approved' });

    const newProviderRef = doc(collection(db, targetCollection));
    batch.set(newProviderRef, newProviderData);

    createNotification({
      recipientId: app.uid,
      senderId: 'admin',
      senderName: 'EliteHub Team',
      type: 'application_approved',
      text: `Congratulations! Your application to be a ${providerType} has been approved.`,
      isRead: false,
      timestamp: serverTimestamp()
    });

    if (providerType === 'Vendor' && app.referralCode) {
      const q = query(collection(db, "vendors"), where("referralCode", "==", app.referralCode));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const referrerDoc = querySnapshot.docs[0];
        const referrerRef = referrerDoc.ref;
        const referrerData = referrerDoc.data() as Vendor;
        const newReferrals = [...(referrerData.referrals || []), newProviderRef.id];
        batch.update(referrerRef, { referrals: newReferrals });
        for (const tier of referralTiers) {
            if (newReferrals.length >= tier.count && !referrerData.claimedReferralTiers?.includes(tier.count)) {
                let updates: any = { claimedReferralTiers: [...(referrerData.claimedReferralTiers || []), tier.count] };
                if (tier.reward === '10 posts') updates.postLimit = increment(10);
                else if (tier.reward === 'verified badge') { updates.isVerified = true; updates.badgeExpirationDate = add(new Date(), { months: 12 }).toISOString(); }
                else if (tier.reward === 'vip status') updates.tier = 'vip';
                else if (tier.reward === 'vvip status') updates.tier = 'vvip';
                batch.update(referrerRef, updates);
            }
        }
      }
    }

    await batch.commit();
    toast({ title: 'Application Approved', description: `${newProviderData.name || newProviderData.businessName || newProviderData.fullName} is now a registered ${providerType.toLowerCase()}.` });
    refreshData();
  };

  const handleRejection = async (appId: string, collectionName: string, name: string) => {
    const appRef = doc(db, collectionName, appId);
    await writeBatch(db).update(appRef, { status: 'rejected' }).commit();
    toast({ title: 'Application Rejected', description: `Application for ${name} has been rejected.` });
    refreshData();
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground">
          Admin Dashboard
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
          Manage applications, providers, and oversee the marketplace community.
        </p>
      </header>

      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Users</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{counts.users}</div></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Products</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{counts.products}</div></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Providers</CardTitle><Wrench className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{counts.vendors + counts.lawyers + counts.logistics + counts.exchange + counts.services}</div></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pending Apps</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{counts.pendingVendors + counts.pendingLawyers + counts.pendingLogistics + counts.pendingExchange + counts.pendingServices}</div>
                    <p className="text-xs text-muted-foreground">
                        {counts.pendingVendors} V, {counts.pendingLawyers} L, {counts.pendingLogistics} LG, {counts.pendingExchange} E, {counts.pendingServices} S
                    </p>
                </CardContent>
            </Card>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold font-headline mb-4">Management Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/users"><Card className="hover:bg-muted/50 transition-colors"><CardHeader><CardTitle className="flex items-center gap-2"><Users />Users</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Manage all user accounts.</p></CardContent></Card></Link>
          <Link href="/admin/vendors"><Card className="hover:bg-muted/50 transition-colors"><CardHeader><CardTitle className="flex items-center gap-2"><Package />Vendors</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Manage product vendors.</p></CardContent></Card></Link>
          <Link href="/admin/lawyers"><Card className="hover:bg-muted/50 transition-colors"><CardHeader><CardTitle className="flex items-center gap-2"><Scale />Lawyers</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Manage legal professionals.</p></CardContent></Card></Link>
          <Link href="/admin/logistics"><Card className="hover:bg-muted/50 transition-colors"><CardHeader><CardTitle className="flex items-center gap-2"><Truck />Logistics</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Manage logistics partners.</p></CardContent></Card></Link>
          <Link href="/admin/currency-exchange"><Card className="hover:bg-muted/50 transition-colors"><CardHeader><CardTitle className="flex items-center gap-2"><ArrowRightLeft />Currency Exchange</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Manage exchange agents.</p></CardContent></Card></Link>
          <Link href="/admin/services"><Card className="hover:bg-muted/50 transition-colors"><CardHeader><CardTitle className="flex items-center gap-2"><Wrench />Service Providers</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Manage all other services.</p></CardContent></Card></Link>
        </div>
      </section>

      <div className="space-y-8">
            <Card className="shadow-lg">
                <CardHeader><CardTitle>Pending Vendor Applications</CardTitle><CardDescription>{applications.length > 0 ? `There are ${applications.length} applications awaiting review.` : 'No pending applications.'}</CardDescription></CardHeader>
                <CardContent><div className="border rounded-md"><Table><TableHeader><TableRow><TableHead>Vendor Name</TableHead><TableHead>Email</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
                {applications.length > 0 ? applications.map((app) => (
                    <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.vendorName}</TableCell><TableCell>{app.email}</TableCell>
                        <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleApplicationDecision(app, 'vendorApplications', 'vendors', {uid: app.uid, name: app.vendorName, fullname: app.fullName, email: app.email, phoneNumber: app.phoneNumber, whatsappNumber: app.whatsappNumber, address: app.address, city: app.city, rcNumber: app.rcNumber, location: app.location, categories: app.categories, trustLevel: 75, referrals: [], claimedReferralTiers: [], referralCode: `${app.username.toUpperCase()}${new Date().getFullYear()}`, memberSince: new Date().toISOString().split('T')[0], profileImage: 'https://placehold.co/128x128', bannerImage: 'https://placehold.co/1200x400', dataAiHint: 'store logo', businessDescription: app.businessDescription, rating: 0, isVerified: false, status: 'active', badgeExpirationDate: null, postLimit: 0, postCount: 0, adBoosts: 0, idCardFront: app.idCardFront || null, idCardBack: app.idCardBack || null, passportPhoto: app.passportPhoto || null, nin: app.nin || null, kycStatus: 'pending'}, 'Vendor')} className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleRejection(app.id, 'vendorApplications', app.vendorName)}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                        </TableCell>
                    </TableRow>
                )) : <TableRow><TableCell colSpan={3} className="text-center h-24">All caught up!</TableCell></TableRow>}
                </TableBody></Table></div></CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader><CardTitle className="flex items-center gap-2"><Scale /> Pending Lawyer Applications</CardTitle><CardDescription>{lawyerApplications.length > 0 ? `There are ${lawyerApplications.length} lawyer applications awaiting review.` : 'No pending lawyer applications.'}</CardDescription></CardHeader>
                <CardContent><div className="border rounded-md"><Table><TableHeader><TableRow><TableHead>Applicant Name</TableHead><TableHead>SCN</TableHead><TableHead>Location</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
                {lawyerApplications.length > 0 ? lawyerApplications.map((app) => (
                    <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.fullName}</TableCell><TableCell>{app.scn}</TableCell><TableCell>{app.location}</TableCell>
                        <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleApplicationDecision(app, 'lawyerApplications', 'lawyers', {uid: app.uid, fullName: app.fullName, email: app.email, phoneNumber: app.phoneNumber, whatsappNumber: app.whatsappNumber, scn: app.scn, tagline: app.tagline, bio: app.bio, city: app.city, location: app.location, yearsOfExperience: app.yearsOfExperience, practiceAreas: app.practiceAreas, profileImage: app.profileImage || 'https://placehold.co/128x128.png', status: 'active', rating: 0, ratingCount: 0, totalRating: 0, isVerified: false, badgeExpirationDate: null, tier: null, profileVisibleUntil: null, idCardFront: app.idCardFront || null, idCardBack: app.idCardBack || null, passportPhoto: app.passportPhoto || null, nin: app.nin || null, kycStatus: 'pending'}, 'Lawyer')} className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleRejection(app.id, 'lawyerApplications', app.fullName)}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                        </TableCell>
                    </TableRow>
                )) : <TableRow><TableCell colSpan={4} className="text-center h-24">All caught up!</TableCell></TableRow>}
                </TableBody></Table></div></CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader><CardTitle className="flex items-center gap-2"><ArrowRightLeft /> Pending Currency Exchange Applications</CardTitle><CardDescription>{exchangeApplications.length > 0 ? `There are ${exchangeApplications.length} applications awaiting review.` : 'No pending currency exchange applications.'}</CardDescription></CardHeader>
                <CardContent><div className="border rounded-md"><Table><TableHeader><TableRow><TableHead>Business Name</TableHead><TableHead>Location</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
                {exchangeApplications.length > 0 ? exchangeApplications.map((app) => (
                    <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.businessName}</TableCell><TableCell>{app.location}</TableCell>
                        <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleApplicationDecision(app, 'currencyExchangeApplications', 'currencyExchangeAgents', {uid: app.uid, fullName: app.fullName, email: app.email, phoneNumber: app.phoneNumber, whatsappNumber: app.whatsappNumber, businessName: app.businessName, bio: app.bio, city: app.city, location: app.location, profileImage: app.profileImage || 'https://placehold.co/128x128.png', currenciesAccepted: app.currenciesAccepted, transactionTypes: app.transactionTypes, operatesOnline: app.operatesOnline, hasPhysicalLocation: app.hasPhysicalLocation, address: app.address || '', status: 'active', rating: 0, ratingCount: 0, totalRating: 0, isVerified: false, badgeExpirationDate: null, tier: null, profileVisibleUntil: null, galleryActiveUntil: null, kycStatus: 'pending', idCardFront: app.idCardFront || null, idCardBack: app.idCardBack || null, passportPhoto: app.passportPhoto || null, nin: app.nin || null}, 'Currency Exchange Agent')} className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleRejection(app.id, 'currencyExchangeApplications', app.businessName)}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                        </TableCell>
                    </TableRow>
                )) : <TableRow><TableCell colSpan={3} className="text-center h-24">All caught up!</TableCell></TableRow>}
                </TableBody></Table></div></CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader><CardTitle className="flex items-center gap-2"><Truck /> Pending Logistics Applications</CardTitle><CardDescription>{logisticsApplications.length > 0 ? `There are ${logisticsApplications.length} applications awaiting review.` : 'No pending logistics applications.'}</CardDescription></CardHeader>
                <CardContent><div className="border rounded-md"><Table><TableHeader><TableRow><TableHead>Company Name</TableHead><TableHead>Category</TableHead><TableHead>Location</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
                {logisticsApplications.length > 0 ? logisticsApplications.map((app) => (
                    <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.name}</TableCell><TableCell>{app.category || 'N/A'}</TableCell><TableCell>{app.location}</TableCell>
                        <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleApplicationDecision(app, 'logisticsApplications', 'logisticsCompanies', {uid: app.uid, name: app.name, email: app.email, phoneNumber: app.phoneNumber, whatsappNumber: app.whatsappNumber, rcNumber: app.rcNumber, bio: app.bio, city: app.city, location: app.location, address: app.address, category: app.category, profileImage: app.profileImage || 'https://placehold.co/128x128.png', status: 'active', rating: 0, ratingCount: 0, totalRating: 0, isVerified: false, badgeExpirationDate: null, tier: null, profileVisibleUntil: null, galleryActiveUntil: null, boostedUntil: null, idCardFront: app.idCardFront || null, idCardBack: app.idCardBack || null, passportPhoto: app.passportPhoto || null, nin: app.nin || null, kycStatus: 'pending'}, 'Logistics Partner')} className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleRejection(app.id, 'logisticsApplications', app.name)}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                        </TableCell>
                    </TableRow>
                )) : <TableRow><TableCell colSpan={4} className="text-center h-24">All caught up!</TableCell></TableRow>}
                </TableBody></Table></div></CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader><CardTitle className="flex items-center gap-2"><Wrench /> Pending Service Provider Applications</CardTitle><CardDescription>{serviceApplications.length > 0 ? `There are ${serviceApplications.length} applications awaiting review.` : 'No pending service provider applications.'}</CardDescription></CardHeader>
                <CardContent><div className="border rounded-md"><Table><TableHeader><TableRow><TableHead>Business Name</TableHead><TableHead>Service</TableHead><TableHead>Location</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
                {serviceApplications.length > 0 ? serviceApplications.map((app) => (
                    <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.businessName}</TableCell><TableCell>{app.serviceType}</TableCell><TableCell>{app.location}</TableCell>
                        <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleApplicationDecision(app, 'serviceProviderApplications', 'serviceProviders', {uid: app.uid, fullName: app.fullName, email: app.email, phoneNumber: app.phoneNumber, whatsappNumber: app.whatsappNumber, businessName: app.businessName, bio: app.bio, city: app.city, location: app.location, profileImage: app.profileImage || 'https://placehold.co/128x128.png', serviceCategory: app.serviceCategory, serviceType: app.serviceType, operatesOnline: app.operatesOnline, hasPhysicalLocation: app.hasPhysicalLocation, address: app.address || '', status: 'active', rating: 0, ratingCount: 0, totalRating: 0, isVerified: false, badgeExpirationDate: null, tier: null, profileVisibleUntil: null, galleryActiveUntil: null, boostedUntil: null, idCardFront: app.idCardFront || null, idCardBack: app.idCardBack || null, passportPhoto: app.passportPhoto || null, nin: app.nin || null, kycStatus: 'pending'}, 'Service Provider')} className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
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
