

'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { fetchVendorById, fetchProductsByVendorId, type Product, type Vendor } from '@/lib/data';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';


export default function AdminVendorProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const vendorId = Array.isArray(params.vendorId) ? params.vendorId[0] : params.vendorId;

  const { toast } = useToast();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const isAdmin = user && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const loadVendorProducts = async (id: string) => {
    const vendorProducts = await fetchProductsByVendorId(id);
    setProducts(vendorProducts);
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You do not have permission to view this page.',
        });
        router.push('/');
        return;
      }
      
      const loadInitialData = async () => {
        if (!vendorId) {
            notFound();
            return;
        }
        const associatedVendor = await fetchVendorById(vendorId);
        if (associatedVendor) {
          setVendor(associatedVendor);
          await loadVendorProducts(associatedVendor.id);
        } else {
           toast({
            variant: 'destructive',
            title: 'Vendor Not Found',
          });
          router.push('/admin');
        }
        setLoadingData(false);
      };
      
      loadInitialData();
    }
  }, [user, authLoading, router, toast, vendorId, isAdmin]);

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
        <p className="ml-4">Loading vendor products...</p>
      </div>
    );
  }
  
  if (!vendor) {
    return <p className="text-center">Redirecting...</p>
  }


  return (
      <div className="space-y-8">
          <header>
            <h1 className="text-4xl font-bold font-headline tracking-tight text-foreground">
                Product Management
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Viewing all products for vendor: <span className="font-semibold text-primary">{vendor.name}</span>
            </p>
          </header>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl w-[95vw] h-[90vh] rounded-lg flex flex-col p-0">
                <ProductForm
                    vendor={vendor}
                    editingProduct={editingProduct}
                    onSuccess={() => {
                        handleDialogClose();
                        loadVendorProducts(vendor.id);
                    }}
                    onCancel={handleDialogClose}
                />
          </DialogContent>
        </Dialog>


        <Card>
            <CardHeader>
                <CardTitle>All Products ({products.length})</CardTitle>
                <CardDescription>Manage and review all product listings for this vendor.</CardDescription>
            </CardHeader>
            <CardContent>
                {products.length > 0 ? (
                    <ProductGrid 
                        products={products}
                        vendors={[vendor]}
                        showAdminControls
                        onEdit={openEditDialog}
                        onToggleStatus={handleToggleProductStatus}
                        onDelete={handleDeleteProduct}
                    />
                ) : (
                    <div className="text-center py-16">
                    <p className="text-xl text-muted-foreground">This vendor hasn't added any products yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
  );
}
