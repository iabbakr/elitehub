

'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Plane, Train, Car, Bike, Truck } from 'lucide-react';
import { logisticsCategories } from '@/lib/data';

const iconMap: { [key: string]: React.ElementType } = {
  'international-flight': Plane,
  'local-flight': Plane,
  'train-logistics': Train,
  'car-logistics': Car,
  'dispatch-rider': Bike,
};

export default function LogisticsCategoriesPage() {
  return (
    <div>
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground flex items-center justify-center gap-3">
          <Truck className="h-10 w-10 text-primary" />
          Logistics Services
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          Choose a logistics category to find reliable partners for your delivery needs.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {logisticsCategories.map((category) => {
          const Icon = iconMap[category.id] || Truck;
          return (
            <Card key={category.id} className="text-center hover:shadow-xl transition-shadow">
              <CardHeader className="items-center">
                <div className="flex-shrink-0 bg-primary/10 text-primary rounded-full h-16 w-16 flex items-center justify-center">
                  <Icon className="h-8 w-8" />
                </div>
                <CardTitle className="mt-4">{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/category/logistics/${category.id}`} passHref>
                  <Button>
                    Find Providers <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
