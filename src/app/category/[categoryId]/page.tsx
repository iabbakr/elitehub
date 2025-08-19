
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { type Product, type Vendor, fetchProducts, productCategories, fetchVendors } from '@/lib/data';
import { ProductGrid } from '@/components/ProductGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ViewToggle, type ViewMode } from '@/components/ViewToggle';

export default function CategoryPage() {
  const params = useParams();
  const categoryId = Array.isArray(params.categoryId) ? params.categoryId[0] : params.categoryId;
  
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const category = useMemo(() => {
    return productCategories.find(c => c.id === categoryId);
  }, [categoryId]);

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

  const filteredProducts = useMemo(() => {
    if (!category) return [];
    
    // First, filter by category
    let categoryProducts = allProducts.filter(p => p.category.toLowerCase() === category.name.toLowerCase() && p.status === 'active');
    
    // Then filter by search term if there is one
    if (searchTerm) {
        categoryProducts = categoryProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    const getVendor = (vendorId: string) => allVendors.find(v => v.id === vendorId);

    // Then, sort the filtered products
    categoryProducts.sort((a, b) => {
        const vendorA = getVendor(a.vendorId);
        const vendorB = getVendor(b.vendorId);

        const tierOrder = { 'vvip': 4, 'vip': 3 };
        const tierA = vendorA?.tier ? tierOrder[vendorA.tier as keyof typeof tierOrder] || 0 : 0;
        const tierB = vendorB?.tier ? tierOrder[vendorB.tier as keyof typeof tierOrder] || 0 : 0;

        if (tierB !== tierA) return tierB - tierA; // Sort by tier first

        const boostedA = a.boostedUntil && new Date(a.boostedUntil) > new Date() ? 2 : 0;
        const boostedB = b.boostedUntil && new Date(b.boostedUntil) > new Date() ? 2 : 0;

        if (boostedB !== boostedA) return boostedB - boostedA; // Then by boost status

        const verifiedA = vendorA?.isVerified ? 1 : 0;
        const verifiedB = vendorB?.isVerified ? 1 : 0;

        if (verifiedB !== verifiedA) return verifiedB - verifiedA; // Then by verified status

        return 0; // Keep original order if all else is equal
    });

    return categoryProducts;
  }, [allProducts, allVendors, category, searchTerm]);

  if (!category && !loading) {
    notFound();
  }

  return (
    <div className="space-y-8">
       <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground">
          {category?.name || 'Category'}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          Browsing all products in the {category?.name.toLowerCase()} category.
        </p>
      </header>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:max-w-lg mx-auto flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
            placeholder={`Search in ${category?.name}...`}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      </div>
      
      <section>
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
            <ProductGrid products={filteredProducts} vendors={allVendors} viewMode={viewMode} />
          )}
        </section>
    </div>
  );
}
