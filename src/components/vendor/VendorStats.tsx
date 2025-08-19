
'use client';

import type { Vendor, Product } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Package, PackageCheck, PackageX, Star, ShieldCheck, TrendingUp } from 'lucide-react';

interface VendorStatsProps {
  vendor: Vendor;
  products: Product[];
}

export function VendorStats({ vendor, products }: VendorStatsProps) {
  const activeProducts = products.filter(p => p.status === 'active').length;
  const inactiveProducts = products.filter(p => p.status === 'closed').length;
  const isVerified = vendor.isVerified && vendor.badgeExpirationDate && new Date(vendor.badgeExpirationDate) > new Date();
  const boostedProductsCount = products.filter(p => p.boostedUntil && new Date(p.boostedUntil) > new Date()).length;

  const stats = [
    {
      title: 'Profile Views',
      value: vendor.profileViews || 0,
      icon: Eye,
      details: null
    },
    {
      title: 'Active Products',
      value: activeProducts,
      icon: PackageCheck,
      details: null
    },
     {
      title: 'Inactive Products',
      value: inactiveProducts,
      icon: PackageX,
      details: null
    },
     {
      title: 'Boosted Products',
      value: boostedProductsCount,
      icon: TrendingUp,
      details: null
    },
    {
      title: 'Subscription Tier',
      value: vendor.tier?.toUpperCase() || 'Standard',
      icon: Star,
      details: vendor.tier && isVerified ? `Expires: ${new Date(vendor.badgeExpirationDate!).toLocaleDateString()}` : null
    },
    {
      title: 'Verification',
      value: isVerified ? 'Active' : 'Inactive',
      icon: ShieldCheck,
      details: isVerified ? `Expires: ${new Date(vendor.badgeExpirationDate!).toLocaleDateString()}` : null
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.details && <p className="text-xs text-muted-foreground">{stat.details}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
