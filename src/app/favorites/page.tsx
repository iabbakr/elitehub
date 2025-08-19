
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from 'next/link';
import { Trash2, XCircle, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const dispatchStorageEvent = () => {
    window.dispatchEvent(new Event("storage"));
};

export default function FavoritesPage() {
  const [favoriteItems, setFavoriteItems] = useState<Product[]>([]);
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
          toast({
              variant: 'destructive',
              title: "Authentication required",
              description: "You must be logged in to view your favorites."
          });
          router.push('/login');
      } else {
          const storedFavorites = localStorage.getItem('user-favorites');
          if (storedFavorites) {
              setFavoriteItems(JSON.parse(storedFavorites));
          }
          setIsDataLoaded(true);
      }
    }
  }, [user, loading, router, toast]);

  const handleRemoveItem = (id: string) => {
    const newFavorites = favoriteItems.filter(item => item.id !== id);
    setFavoriteItems(newFavorites);
    localStorage.setItem('user-favorites', JSON.stringify(newFavorites));
    dispatchStorageEvent();
    toast({
        title: 'Removed from Favorites',
    });
  };

  const handleClearAll = () => {
    setFavoriteItems([]);
    localStorage.removeItem('user-favorites');
    dispatchStorageEvent();
     toast({
        title: 'Favorites Cleared',
        description: 'All your saved items have been removed.',
    });
  }
  
  if (loading || !isDataLoaded) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Loading Favorites...</p>
      </div>
    );
  }

  return (
    <div>
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground flex items-center justify-center gap-3">
          <Heart className="h-10 w-10 text-primary"/>
          My Favorites
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          Your saved products for future reference. Click on any item to view its details.
        </p>
      </header>

      <Card className="shadow-lg">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Favorite Items ({favoriteItems.length})</CardTitle>
             {favoriteItems.length > 0 && (
                 <Button variant="outline" onClick={handleClearAll}>
                    <Trash2 className="mr-2"/>
                    Clear All
                 </Button>
             )}
          </CardHeader>
          <CardContent>
            {favoriteItems.length > 0 ? (
                <>
                    <div className="space-y-4">
                    {favoriteItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between gap-4">
                           <Link href={`/products/${item.id}`} className="flex items-center gap-4 group">
                                <Image src={item.images[0]} alt={item.name} width={80} height={80} className="rounded-md" data-ai-hint={item.dataAiHint}/>
                                <div>
                                    <p className="font-semibold group-hover:text-primary transition-colors">{item.name}</p>
                                    {typeof item.price === 'number' && (
                                        <p className="text-sm text-primary font-bold">₦{item.price.toLocaleString()}</p>
                                    )}
                                </div>
                           </Link>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveItem(item.id)}>
                                <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>
                    ))}
                    </div>
                </>
            ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <Heart className="mx-auto h-12 w-12" />
                    <p className="mt-4">You haven't favorited any items yet.</p>
                </div>
            )}
          </CardContent>
        </Card>
    </div>
  )
}
