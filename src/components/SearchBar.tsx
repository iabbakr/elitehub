
'use client';

import { useState, useMemo, useEffect } from 'react';
import { type Product, type Vendor, nigerianStates, type productCategories as CategoryType } from '@/lib/data';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { FilterState } from '@/lib/data';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"


interface SearchBarProps {
    vendors: Vendor[];
    products: Product[];
    categories: typeof CategoryType;
    onFilterChange: (filters: FilterState) => void;
}

export function SearchBar({ vendors, products, categories, onFilterChange }: SearchBarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [location, setLocation] = useState('all');
    const [category, setCategory] = useState('all');
    const [vendor, setVendor] = useState('all');
    const [brand, setBrand] = useState('all');
    const [productName, setProductName] = useState('');

    const uniqueBrands = useMemo(() => {
        const brands = products
            .map(p => p.brand)
            .filter((b): b is string => typeof b === 'string' && b.length > 0);
        return [...new Set(brands)];
    }, [products]);

    useEffect(() => {
      const handler = setTimeout(() => {
        onFilterChange({
            location,
            category,
            vendor,
            brand,
            product: productName
        });
      }, 300); // Debounce search
      
      return () => clearTimeout(handler);

    }, [location, vendor, brand, productName, category, onFilterChange]);


    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="space-y-2"
        >
            <div className="flex items-center gap-4 px-4 py-2 bg-card rounded-xl shadow-md border">
                 {/* Product Name Search */}
                 <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Looking for"
                        className="pl-10 h-12 text-base"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                    />
                </div>
                <CollapsibleTrigger asChild>
                    <Button variant="outline" size="lg" className="shrink-0 md:w-auto">
                        <SlidersHorizontal className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Filters</span>
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="p-4 bg-card rounded-xl shadow-md border">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Location Filter */}
                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-sm font-medium">Location</label>
                        <Select value={location} onValueChange={setLocation}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Location" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Locations</SelectItem>
                                {nigerianStates.map(state => (
                                    <SelectItem key={state} value={state}>{state}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     {/* Category Filter */}
                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-sm font-medium">Category</label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Vendor Filter */}
                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-sm font-medium">Vendor</label>
                        <Select value={vendor} onValueChange={setVendor}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Vendor" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Vendors</SelectItem>
                                {vendors.map(v => (
                                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Brand Filter */}
                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-sm font-medium">Brand</label>
                        <Select value={brand} onValueChange={setBrand}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Brand" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Brands</SelectItem>
                                {uniqueBrands.map(b => (
                                    <SelectItem key={b} value={b}>{b}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
