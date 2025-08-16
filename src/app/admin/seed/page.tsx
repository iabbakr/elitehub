
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { Loader2, UploadCloud } from 'lucide-react';
import { productCategories, nigerianStates } from '@/lib/data';

const generateDummyData = () => {
    const vendors = [];
    const products = [];

    for (const category of productCategories) {
        const vendorName = `${category.name.replace(/\s/g, '')} World`;
        const username = category.name.replace(/\s/g, '').toLowerCase();
        
        const vendor = {
            uid: `seeded-user-${Math.random().toString(36).substring(2, 10)}`,
            name: vendorName,
            fullname: `CEO of ${vendorName}`,
            email: `${username}@example.com`,
            phoneNumber: '08012345678',
            address: `123 ${category.name} Lane, Ikeja`,
            location: nigerianStates[Math.floor(Math.random() * nigerianStates.length)],
            categories: [category.id],
            trustLevel: 70 + Math.floor(Math.random() * 25), // 70-95
            referralChain: [],
            referralCode: `${username.toUpperCase()}${new Date().getFullYear()}`,
            memberSince: new Date(new Date().setMonth(new Date().getMonth() - Math.floor(Math.random() * 12))).toISOString().split('T')[0],
            profileImage: 'https://placehold.co/128x128',
            bannerImage: 'https://placehold.co/1200x400',
            dataAiHint: 'store logo',
            businessDescription: `The best place for all your ${category.name.toLowerCase()} needs. We offer top quality products and services.`,
            rating: Math.round((4 + Math.random()) * 10) / 10, // 4.0-5.0
            isVerified: Math.random() > 0.5,
            status: 'active',
            badgeExpirationDate: null,
            postLimit: 20,
            postCount: 2, // Start with 2 posts
            adBoosts: Math.floor(Math.random() * 10),
        };
        vendors.push(vendor);

        const product1 = {
            // vendorId will be set after vendor is created
            name: `Premium ${category.name.slice(0, -1)}`,
            price: Math.floor(Math.random() * 10000) + 5000,
            images: ['https://placehold.co/600x400', 'https://placehold.co/600x400', 'https://placehold.co/600x400'],
            category: category.name,
            brand: 'EliteBrand',
            colors: 'Black, White, Blue',
            rating: Math.round((4 + Math.random()) * 10) / 10,
            reviewsCount: Math.floor(Math.random() * 50),
            dataAiHint: `${category.name.toLowerCase()} product`,
            description: `A top-of-the-line, premium quality ${category.name.slice(0, -1).toLowerCase()} for the discerning customer. Made with the finest materials.`,
            status: 'active' as 'active' | 'closed',
            payOnDelivery: Math.random() > 0.5,
        };
        
        const product2 = {
            // vendorId will be set after vendor is created
            name: `Standard ${category.name.slice(0, -1)}`,
            price: Math.floor(Math.random() * 8000) + 2000,
            images: ['https://placehold.co/600x400', 'https://placehold.co/600x400', 'https://placehold.co/600x400'],
            category: category.name,
            brand: 'ValueBrand',
            colors: 'Red, Gray',
            rating: Math.round((3.5 + Math.random()) * 10) / 10,
            reviewsCount: Math.floor(Math.random() * 25),
            dataAiHint: `${category.name.toLowerCase()} item`,
            description: `An affordable and reliable ${category.name.slice(0, -1).toLowerCase()}. Great value for money.`,
            status: 'active' as 'active' | 'closed',
            payOnDelivery: Math.random() > 0.5,
        };

        products.push([product1, product2]);
    }

    return { vendors, products };
};

export default function SeedDataPage() {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSeed = async () => {
        setLoading(true);
        toast({ title: 'Starting data seed...', description: 'Generating and uploading vendor and product data.' });

        try {
            const vendorsRef = collection(db, 'vendors');
            const { vendors: dummyVendors, products: dummyProducts } = generateDummyData();
            
            // Check which vendors already exist
            const existingVendorNames = new Set((await getDocs(vendorsRef)).docs.map(doc => doc.data().name));
            
            const batch = writeBatch(db);
            let createdVendors = 0;
            let createdProducts = 0;

            for (let i = 0; i < dummyVendors.length; i++) {
                const vendorData = dummyVendors[i];
                if (!existingVendorNames.has(vendorData.name)) {
                    createdVendors++;
                    const newVendorRef = doc(collection(db, "vendors"));
                    batch.set(newVendorRef, vendorData);
                    
                    // Create products for this new vendor
                    const productsForVendor = dummyProducts[i];
                    for (const product of productsForVendor) {
                        createdProducts++;
                        const productData = { ...product, vendorId: newVendorRef.id };
                        const newProductRef = doc(collection(db, "products"));
                        batch.set(newProductRef, productData);
                    }
                }
            }


            if (createdVendors === 0) {
                 toast({ title: 'Database Already Seeded!', description: `All ${dummyVendors.length} vendors (and their products) already exist.` });
                 setLoading(false);
                 return;
            }

            await batch.commit();
            
            toast({ title: 'Seed Successful!', description: `Successfully created ${createdVendors} new vendors and ${createdProducts} new products.` });

        } catch (error) {
            console.error("Error seeding data: ", error);
            toast({ variant: 'destructive', title: 'Seeding Failed', description: 'An error occurred. Check the console for details.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center py-12">
            <Card className="w-full max-w-lg shadow-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary text-primary-foreground rounded-full h-20 w-20 flex items-center justify-center">
                        <UploadCloud className="h-10 w-10" />
                    </div>
                    <CardTitle className="mt-4 text-3xl font-bold font-headline">Seed Database</CardTitle>
                    <CardDescription>
                        This is a one-time action to upload one dummy vendor and two related products for each of the 13 product categories to the Firestore database.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleSeed} disabled={loading} className="w-full">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Seeding...
                            </>
                        ) : (
                            "Seed Dummy Data to Firestore"
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
