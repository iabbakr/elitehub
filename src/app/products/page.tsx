
'use client';

import { useEffect, useState, useMemo } from 'react';
import { type Product, type Vendor, fetchProducts, fetchVendors, productCategories } from '@/lib/data';
import { ProductGrid } from '@/components/ProductGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchBar } from '@/components/SearchBar';
import type { FilterState } from '@/lib/data';
import { ViewToggle, type ViewMode } from '@/components/ViewToggle';

export default function AllProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    location: 'all',
    category: 'all',
    vendor: 'all',
    brand: 'all',
    product: '',
  });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [productsList, vendorsList] = await Promise.all([
            fetchProducts(),
            fetchVendors()
        ]);
        setAllProducts(productsList.filter(p => p.status === 'active'));
        setAllVendors(vendorsList);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const sortedAndFilteredProducts = useMemo(() => {
    let products = [...allProducts];
    const getVendor = (vendorId: string) => allVendors.find(v => v.id === vendorId);

    // Filter by various criteria
    if (filters.vendor !== 'all') {
        products = products.filter(p => p.vendorId === filters.vendor);
    } else if (filters.location !== 'all') {
        const vendorIdsInLocation = allVendors
            .filter(v => v.location === filters.location)
            .map(v => v.id);
        products = products.filter(p => vendorIdsInLocation.includes(p.vendorId));
    }

    if (filters.category !== 'all') {
        products = products.filter(p => p.category === filters.category);
    }

    if (filters.brand !== 'all') {
        products = products.filter(p => p.brand && p.brand.toLowerCase() === filters.brand.toLowerCase());
    }

    if (filters.product) {
        products = products.filter(p => p.name.toLowerCase().includes(filters.product.toLowerCase()));
    }
    
    // Sort the filtered products based on the new hierarchy
    products.sort((a, b) => {
        const vendorA = getVendor(a.vendorId);
        const vendorB = getVendor(b.vendorId);

        const tierOrder = { 'vvip': 4, 'vip': 3 };
        
        const tierA = vendorA?.tier ? tierOrder[vendorA.tier as keyof typeof tierOrder] || 0 : 0;
        const tierB = vendorB?.tier ? tierOrder[vendorB.tier as keyof typeof tierOrder] || 0 : 0;
        if (tierB !== tierA) return tierB - tierA;

        const boostedA = a.boostedUntil && new Date(a.boostedUntil) > new Date() ? 2 : 0;
        const boostedB = b.boostedUntil && new Date(b.boostedUntil) > new Date() ? 2 : 0;
        if (boostedB !== boostedA) return boostedB - boostedA;

        const isBadgeActive = (v?: Vendor) => v?.isVerified && v?.badgeExpirationDate && new Date(v.badgeExpirationDate) > new Date();
        const verifiedA = isBadgeActive(vendorA) ? 1 : 0;
        const verifiedB = isBadgeActive(vendorB) ? 1 : 0;
        if (verifiedB !== verifiedA) return verifiedB - verifiedA;
        
        return 0; // Keep original order if all else is equal
    });

    return products;

  }, [allProducts, allVendors, filters]);


  return (
    <div className="space-y-8">
       <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground">
          All Products
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          Browse all available products from our trusted vendors.
        </p>
      </header>

      {loading ? (
        <div className="space-y-2">
            <div className="flex items-center gap-4 px-4 py-2 bg-card rounded-xl shadow-md border">
                 <div className="relative w-full">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-12 w-full" />
                </div>
                <Skeleton className="h-12 w-28" />
            </div>
        </div>
      ) : (
        <SearchBar
          vendors={allVendors}
          products={allProducts}
          categories={productCategories}
          onFilterChange={setFilters}
        />
      )}

      <div className="flex justify-end">
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      </div>
      
      <section>
          {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(12)].map((_, i) => (
                      <div key={i} className="space-y-2">
                          <Skeleton className="h-48 w-full" />
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                      </div>
                  ))}
              </div>
          ) : (
            <ProductGrid products={sortedAndFilteredProducts} vendors={allVendors} viewMode={viewMode} />
          )}
        </section>
    </div>
  );
}
