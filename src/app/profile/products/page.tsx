

'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { fetchVendorByUid, fetchProductsByVendorId, type Product, type Vendor } from '@/lib/data';
import { Loader2, PackagePlus } from 'lucide-react';
import { ProductGrid } from '@/components/ProductGrid';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ProductForm } from '@/components/vendor/ProductForm';
import { ViewToggle, type ViewMode } from '@/components/ViewToggle';


function MyProductsPageComponent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const loadVendorProducts = async (vendorId: string) => {
    const vendorProducts = await fetchProductsByVendorId(vendorId);
    setProducts(vendorProducts);
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      const loadInitialData = async () => {
        const associatedVendor = await fetchVendorByUid(user.uid);
        if (associatedVendor) {
          setVendor(associatedVendor);
          await loadVendorProducts(associatedVendor.id);
        } else {
          // If the user is not a vendor, redirect them.
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You must be a vendor to access this page.',
          });
          router.push('/profile');
        }
        setLoadingData(false);
      };
      
      loadInitialData();
    }
  }, [user, authLoading, router, toast]);

   useEffect(() => {
    if (searchParams.get('addProduct') === 'true') {
        openNewDialog();
    }
   }, [searchParams]);

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  }
  
  const openNewDialog = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    // Remove the query param from the URL without reloading
    router.replace('/profile/products', { scroll: false });
  }

  const handleToggleProductStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'closed' : 'active';
    try {
        await updateDoc(doc(db, "products", product.id), { status: newStatus });
        toast({ title: "Product Status Updated", description: `${product.name} has been ${newStatus}.` });
        if (vendor) {
            loadVendorProducts(vendor.id);
        }
    } catch (error) {
        console.error("Error updating product status:", error);
        toast({ variant: 'destructive', title: "Error", description: "Failed to update product status." });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
        await deleteDoc(doc(db, "products", productId));
        toast({ title: "Product Deleted" });
        if (vendor) {
            loadVendorProducts(vendor.id);
        }
    } catch (error) {
        console.error("Error deleting product:", error);
        toast({ variant: 'destructive', title: "Error", description: "Failed to delete product." });
    }
  };

  if (authLoading || loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <p className="ml-4">Loading your products...</p>
      </div>
    );
  }
  
  if (!vendor) {
    // This case should be handled by the redirect, but as a fallback
    return <p className="text-center">Redirecting...</p>
  }


  return (
      <div className="space-y-8">
          <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
               <h1 className="text-4xl font-bold font-headline tracking-tight text-foreground">
                  My Products
               </h1>
               <p className="mt-2 text-lg text-muted-foreground">
                  Manage all of your product listings.
               </p>
            </div>
             <div className="flex items-center gap-4">
                <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                <Button onClick={openNewDialog}>
                    <PackagePlus className="mr-2 h-5 w-5" />
                    Add New Product
                </Button>
            </div>
          </header>

        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
            if (!isOpen) {
                handleDialogClose();
            } else {
                setIsDialogOpen(true);
            }
        }}>
          <DialogContent className="sm:max-w-2xl w-[95vw] h-[90vh] rounded-lg flex flex-col p-0">
                <ProductForm
                    vendor={vendor}
                    existingProducts={products}
                    editingProduct={editingProduct}
                    onSuccess={() => {
                        handleDialogClose();
                        loadVendorProducts(vendor.id);
                    }}
                    onCancel={handleDialogClose}
                />
          </DialogContent>
        </Dialog>


        <div className="border rounded-md p-4">
          {products.length > 0 ? (
            <ProductGrid 
                products={products}
                vendors={[vendor]}
                showAdminControls
                isVendorOwnerView
                viewMode={viewMode}
                onEdit={openEditDialog}
                onToggleStatus={handleToggleProductStatus}
                onDelete={handleDeleteProduct}
            />
          ) : (
             <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">You haven't added any products yet.</p>
                <Button className="mt-4" onClick={openNewDialog}>
                    <PackagePlus className="mr-2 h-5 w-5" />
                    Add Your First Product
                </Button>
             </div>
          )}
        </div>
      </div>
  );
}

export default function MyProductsPage() {
    return (
      <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
        <MyProductsPageComponent />
      </Suspense>
    );
}



