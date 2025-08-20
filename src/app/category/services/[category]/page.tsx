

'use client';

import { useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { serviceCategories, serviceSubCategories } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function ServiceSubCategoryPage() {
  const params = useParams();
  const categoryId = Array.isArray(params.category) ? params.category[0] : params.category;

  const category = useMemo(() => {
    return serviceCategories.find(c => c.id === categoryId);
  }, [categoryId]);

  const subCategories = useMemo(() => {
    if (!category) return [];
    return serviceSubCategories[category.name] || [];
  }, [category]);

  if (!category) {
    notFound();
  }

  return (
    <div>
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground flex items-center justify-center gap-3">
          <Wrench className="h-10 w-10 text-primary" />
          {category.name}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          Choose a specific service to find the right professional for your needs.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {subCategories.map((subCategory) => (
          <Link key={subCategory} href={`/category/services/${category.id}/${subCategory.toLowerCase().replace(/ /g, '-')}`} passHref>
            <Card className="text-center hover:shadow-xl transition-shadow h-full flex flex-col justify-center items-center p-4">
              <CardContent className="p-2">
                  <p className="font-semibold">{subCategory}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {subCategories.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <p>No sub-categories found for {category.name}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
