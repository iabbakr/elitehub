
'use client';

import { useEffect, useState, useMemo } from 'react';
import { type Product, type Vendor, productCategories } from '@/lib/data';
import { Categories } from '@/components/Categories';
import { ProductGrid } from '@/components/ProductGrid';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchBar } from '@/components/SearchBar';
import { fetchProducts, fetchVendors } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';
import type { FilterState } from '@/lib/data';

// Function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};


export default function Home() {
  const { user } = useAuth();
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
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [productsList, vendorsList] = await Promise.all([
            fetchProducts(),
            fetchVendors()
        ]);
        setAllProducts(productsList);
        setAllVendors(vendorsList);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (user && allProducts.length > 0) {
        const storedFavorites = localStorage.getItem('user-favorites');
        if (storedFavorites) {
            const favoriteItems: Product[] = JSON.parse(storedFavorites);
            if (favoriteItems.length > 0) {
                const favoriteCategories = [...new Set(favoriteItems.map(p => p.category))];
                const recommendations = allProducts.filter(p =>
                    favoriteCategories.includes(p.category) &&
                    !favoriteItems.some(fav => fav.id === p.id) &&
                    p.status === 'active'
                ).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')); // Show newest first
                setRecommendedProducts(recommendations.slice(0, 4)); // Limit to 4 recommendations
            }
        }
    } else {
        setRecommendedProducts([]);
    }
  }, [user, allProducts]);


  const filteredProducts = useMemo(() => {
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

    return products;
  }, [allProducts, allVendors, filters]);
  
  const featuredProducts = useMemo(() => {
    const getVendor = (vendorId: string) => allVendors.find(v => v.id === vendorId);
    
    // Show search results if any filter is active
    if (filters.location !== 'all' || filters.vendor !== 'all' || filters.brand !== 'all' || filters.product || filters.category !== 'all') {
        return filteredProducts.slice(0, 8);
    }
    
    // Otherwise, show VVIP, VIP, and Boosted products
    const featured = allProducts.filter(p => {
        const vendor = getVendor(p.vendorId);
        if (!vendor) return false;
        const isBoosted = p.boostedUntil && new Date(p.boostedUntil) > new Date();
        return vendor.tier === 'vvip' || vendor.tier === 'vip' || isBoosted;
    });

    featured.sort((a, b) => {
        const vendorA = getVendor(a.vendorId);
        const vendorB = getVendor(b.vendorId);

        if (!vendorA || !vendorB) return 0;

        const tierOrder = { 'vvip': 3, 'vip': 2 };
        const tierA = vendorA.tier ? tierOrder[vendorA.tier as keyof typeof tierOrder] || 0 : 0;
        const tierB = vendorB.tier ? tierOrder[vendorB.tier as keyof typeof tierOrder] || 0 : 0;

        if (tierB !== tierA) return tierB - tierA; // VVIPs first, then VIPs

        const boostedA = a.boostedUntil && new Date(a.boostedUntil) > new Date();
        const boostedB = b.boostedUntil && new Date(b.boostedUntil) > new Date();

        if (boostedB && !boostedA) return 1; // Boosted items before non-boosted
        if (!boostedB && boostedA) return -1;
        
        return 0; // Keep original order if all else is equal
    });

    return featured.slice(0, 8);
  }, [allProducts, allVendors, filteredProducts, filters]);


  return (
    <div className="space-y-8">
      {/* Search Bar */}
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
      
      <div className="space-y-16">
        {/* Categories */}
        <Categories />

        {/* Recommended Products Section */}
        {recommendedProducts.length > 0 && (
          <section id="recommended-products">
            <h2 className="text-3xl font-bold font-headline tracking-tight text-foreground mb-8 text-center">
              Recommended for You
            </h2>
            <ProductGrid products={recommendedProducts} vendors={allVendors} />
          </section>
        )}
        
        {/* Featured Products Section */}
        <section id="featured-products">
           <h2 className="text-3xl font-bold font-headline tracking-tight text-foreground mb-8 text-center">
              { (filters.location !== 'all' || filters.vendor !== 'all' || filters.brand !== 'all' || filters.product || filters.category !== 'all') ? 'Search Results' : 'Featured Products' }
           </h2>
          {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                      <div key={i} className="space-y-2">
                          <Skeleton className="h-48 w-full" />
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                      </div>
                  ))}
              </div>
          ) : (
            <ProductGrid products={featuredProducts} vendors={allVendors} />
          )}
        </section>
      </div>
    </div>
  );
}
