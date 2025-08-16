
'use client';

import React, { useState } from 'react';
import {
  Computer,
  Smartphone,
  Plug,
  Car,
  Shirt,
  Home,
  Truck,
  Watch,
  Gamepad2,
  Sofa,
  CookingPot,
  ShoppingCart,
  Armchair,
  ChevronsUpDown,
  Wifi,
  KeyRound,
  SprayCan,
  Leaf,
  Gem,
  Lamp,
  Wrench,
  ArrowRightLeft,
  Scale
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from '@/components/ui/button';
import { productCategories } from '@/lib/data';

const iconMap: { [key: string]: React.ElementType } = {
  'computers': Computer,
  'mobile-phones': Smartphone,
  'electronics': Plug,
  'fashion': Shirt,
  'accessories': Watch,
  'gaming': Gamepad2,
  'home-goods': Armchair,
  'furniture': Sofa,
  'kitchenware': CookingPot,
  'groceries': ShoppingCart,
  'automobile': Car,
  'property': Home,
  'logistics': Truck,
  'internet-providers': Wifi,
  'cosmetics': SprayCan,
  'agriculture': Leaf,
  'precious-metals-minerals': Gem,
  'services': Wrench,
  'currency-exchange': ArrowRightLeft,
  'find-a-lawyer': Scale,
};


export function Categories() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="mb-12 border rounded-xl"
    >
      <div className="flex items-center justify-between p-4">
        <h2 className="text-2xl font-bold font-headline tracking-tight text-foreground">
          Browse by Category
        </h2>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 p-0">
            <ChevronsUpDown className="h-4 w-4" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-10 gap-4 p-4 pt-0">
          {productCategories.map((category) => {
            const Icon = iconMap[category.id] || Computer;
            return (
              <Link href={`/category/${category.id}`} key={category.id} className="group">
                <Card className="h-full flex flex-col items-center justify-center p-4 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-primary/5">
                  <CardContent className="p-0 flex flex-col items-center justify-center gap-2">
                    <Icon className="h-8 w-8 text-primary transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-xs font-semibold text-foreground">{category.name}</span>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
