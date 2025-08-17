
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
                ).sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)); // Show newest first
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
    const source = (filters.location !== 'all' || filters.vendor !== 'all' || filters.brand !== 'all' || filters.product || filters.category !== 'all')
        ? filteredProducts
        : allProducts;

    const boostedProducts = source.filter(p => p.boostedUntil && new Date(p.boostedUntil) > new Date());
    const regularProducts = source.filter(p => !p.boostedUntil || new Date(p.boostedUntil) <= new Date());
    
    // Sort boosted products by expiration date, newest first
    boostedProducts.sort((a, b) => new Date(b.boostedUntil!).getTime() - new Date(a.boostedUntil!).getTime());
    
    // Shuffle regular products
    const shuffledRegularProducts = shuffleArray(regularProducts);
    
    // Combine and slice
    const combined = [...boostedProducts, ...shuffledRegularProducts];
    
    return combined.slice(0, 8);
  }, [allProducts, filteredProducts, filters]);


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
