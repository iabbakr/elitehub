
'use client';

import { useEffect, useState, useMemo } from 'react';
import { type Product, type Vendor, fetchProducts, fetchVendors, productCategories } from '@/lib/data';
import { ProductGrid } from '@/components/ProductGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchBar } from '@/components/SearchBar';
import type { FilterState } from '@/lib/data';

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

    // Filter by vendor (which indirectly filters by location)
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

    // Filter by brand
    if (filters.brand !== 'all') {
        products = products.filter(p => p.brand && p.brand.toLowerCase() === filters.brand.toLowerCase());
    }

    // Filter by product name
    if (filters.product) {
        products = products.filter(p => p.name.toLowerCase().includes(filters.product.toLowerCase()));
    }
    
    // Then, separate boosted products from the filtered list
    const boostedProducts = products.filter(p => p.boostedUntil && new Date(p.boostedUntil) > new Date());
    const regularProducts = products.filter(p => !p.boostedUntil || new Date(p.boostedUntil) <= new Date());

    // Sort boosted products by expiration date, newest first
    boostedProducts.sort((a, b) => new Date(b.boostedUntil!).getTime() - new Date(a.boostedUntil!).getTime());

    // Return boosted products at the top
    return [...boostedProducts, ...regularProducts];

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
            <ProductGrid products={sortedAndFilteredProducts} vendors={allVendors} />
          )}
        </section>
    </div>
  );
}
