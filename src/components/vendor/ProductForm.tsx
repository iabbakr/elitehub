
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, updateDoc, runTransaction, increment } from 'firebase/firestore';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Paperclip } from 'lucide-react';
import { productCategories, nigerianStates, type Vendor, type Product, createNotification } from '@/lib/data';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const productFormSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters."),
  price: z.coerce.number().min(1, "Price must be a positive number.").optional(),
  category: z.string({ required_error: "Please select a category."}).min(1, "Please select a category."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(300, "Description cannot be more than 300 characters."),
  images: z.any(),
  payOnDelivery: z.boolean().optional(),
  type: z.string().optional(),
  // General optional fields
  brand: z.string().optional(),
  condition: z.enum(['new', 'used', 'thrift']).optional(),
  colors: z.string().optional(),
  // Property specific
  location: z.string().optional(),
  address: z.string().optional(),
  size: z.string().optional(),
  // Fashion specific
  gender: z.enum(['Men', 'Women', 'Children', 'Unisex']).optional(),
  // Automobile specific
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().optional(),
  mileage: z.coerce.number().optional(),
  transmission: z.enum(['automatic', 'manual']).optional(),
  fuelType: z.enum(['petrol', 'diesel', 'electric', 'hybrid']).optional(),
  // Precious Metals & Minerals specific
  preciousMetalType: z.string().optional(),
  purity: z.string().optional(),
  weight: z.string().optional(),
  form: z.string().optional(),
  sourceOrigin: z.string().optional(),
  pricePerGram: z.coerce.number().optional(),
  assayCertificate: z.boolean().optional(),
  serialNumber: z.string().optional(),
  // Computer specific
  ram: z.string().optional(),
  storage: z.string().optional(),
  inches: z.string().optional(),
  processorType: z.string().optional(),
  generation: z.string().optional(),
  dedicatedGraphicsMemory: z.string().optional(),
  // Mobile Phone specific
  batteryHealth: z.string().optional(),
  // Electronics Specific
  displayType: z.string().optional(),
  connectivity: z.string().optional(),
  smart: z.boolean().optional(),
  // Accessories specific
  mah: z.string().optional(),
  // Kitchenware specific
  material: z.string().optional(),
  powerSource: z.string().optional(),
  // Internet Provider specific
  network: z.string().optional(),
  speed: z.string().optional(),
}).superRefine((data, ctx) => {
    // Shared validation for images
    if (data.images && !data.images.editing) {
        const files = data.images as FileList;
        const fileCount = files.length;
        
        const isUsed = data.condition === 'used';
        
        // Max limit for all
        if (fileCount > 5) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "You can upload a maximum of 5 images.", path: ["images"] });
        }

        // Min limit based on condition
        if (isUsed) {
             if (fileCount < 3) {
                 ctx.addIssue({ code: z.ZodIssueCode.custom, message: "You must upload at least 3 images for used items.", path: ["images"] });
            }
        } else { // 'new' or 'thrift'
             if (fileCount < 1) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "You must upload at least 1 image.", path: ["images"] });
            }
        }
    }
    
    // Price is required for non-precious-metals categories
    if (data.category !== 'Precious Metals & Minerals' && (data.price === undefined || data.price <= 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Price must be a positive number.",
            path: ["price"],
        });
    }

    switch (data.category) {
        case 'Property':
            if (!data.location) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Location is required.", path: ["location"] });
            if (!data.address) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Address is required.", path: ["address"] });
            if (!data.type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Type (e.g. Rent, Sale) is required.", path: ["type"] });
            break;
        case 'Automobile':
            if (!data.make) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Make is required.", path: ["make"] });
            if (!data.model) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Model is required.", path: ["model"] });
            if (!data.year) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Year is required.", path: ["year"] });
            if (!data.mileage) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Mileage is required.", path: ["mileage"] });
            if (!data.condition) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Condition is required.", path: ["condition"] });
            if (!data.transmission) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Transmission type is required.", path: ["transmission"] });
            if (!data.fuelType) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Fuel type is required.", path: ["fuelType"] });
            break;
        case 'Fashion':
            if (!data.gender) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Gender is required.", path: ["gender"] });
            if (!data.size) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Size is required.", path: ["size"] });
            if (!data.type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Type (e.g. Gown, Shoe) is required.", path: ["type"] });
            if (!data.colors) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Available colors are required.", path: ["colors"] });
            if (!data.condition) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Condition is required.", path: ["condition"] });
            if (data.condition !== 'new' && data.condition !== 'thrift') {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Condition must be 'New' or 'Thrift'.", path: ["condition"] });
            }
            break;
        case 'Precious Metals & Minerals':
             if (!data.preciousMetalType) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Type is required.", path: ["preciousMetalType"] });
             if (!data.weight) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Weight is required.", path: ["weight"] });
             if (!data.form) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Form is required.", path: ["form"] });
             if (!data.sourceOrigin) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Source/Origin is required.", path: ["sourceOrigin"] });
            break;
        case 'Computers':
            if (!data.brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Brand is required.", path: ["brand"] });
            if (!data.type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Type is required (e.g., Laptop, Desktop).", path: ["type"] });
            if (!data.ram) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "RAM is required.", path: ["ram"] });
            if (!data.storage) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Storage is required.", path: ["storage"] });
            if (!data.inches) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Screen size (inches) is required.", path: ["inches"] });
            if (!data.processorType) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Processor type is required.", path: ["processorType"] });
            if (!data.condition) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Condition is required.", path: ["condition"] });
            break;
        case 'Mobile Phones':
            if (!data.brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Brand is required.", path: ["brand"] });
            if (!data.type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Type is required (e.g., Smartphone, Feature Phone).", path: ["type"] });
            if (!data.model) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Model is required (e.g. iPhone 15 Pro).", path: ["model"] });
            if (!data.storage) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Storage is required.", path: ["storage"] });
            if (!data.ram) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "RAM is required.", path: ["ram"] });
            if (!data.colors) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Available colors are required.", path: ["colors"] });
            if (!data.condition) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Condition is required.", path: ["condition"] });
            break;
        case 'Electronics':
            if (!data.brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Brand is required.", path: ["brand"] });
            if (!data.type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Type is required (e.g. Television, Speaker).", path: ["type"] });
            if (!data.condition) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Condition is required.", path: ["condition"] });
            break;
        case 'Accessories':
            if (!data.brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Brand is required.", path: ["brand"] });
            if (!data.type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Type is required (e.g., Smartwatch, Headphones).", path: ["type"] });
            if (!data.condition) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Condition is required.", path: ["condition"] });
            if (!data.colors) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Color is required.", path: ["colors"] });
            break;
        case 'Gaming':
            if (!data.brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Brand is required.", path: ["brand"] });
            if (!data.type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Type is required (e.g., Console, Controller).", path: ["type"] });
            if (!data.condition) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Condition is required.", path: ["condition"] });
            if (!data.colors) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Color is required.", path: ["colors"] });
            break;
        case 'Furniture':
            if (!data.type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Type is required (e.g., Sofa, Bed Frame, Dining Table).", path: ["type"] });
            break;
        case 'Home Goods':
            if (!data.type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Type is required.", path: ["type"] });
            break;
        case 'Kitchenware':
            if (!data.type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Type is required.", path: ["type"] });
            if (!data.condition) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Condition is required.", path: ["condition"] });
            break;
        case 'Agriculture':
            if (!data.type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Type is required.", path: ["type"] });
            break;
        case 'Cosmetics':
            if (!data.type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Type is required.", path: ["type"] });
            break;
        case 'Groceries':
            if (!data.type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Type is required.", path: ["type"] });
            break;
        case 'Internet Providers':
            if (!data.type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Type is required (e.g. Modem, Router, MiFi).", path: ["type"] });
            if (!data.model) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Model is required.", path: ["model"] });
            if (!data.network) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Network is required (e.g. MTN, Glo, Spectranet).", path: ["network"] });
            if (data.price === undefined || data.price <= 0) {
                 ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Price must be a positive number for this category.",
                    path: ["price"],
                });
            }
            break;
        default: // Default fields for all other physical goods
            if (!data.condition) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Condition is required.", path: ["condition"] });
            if (!data.brand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Brand is required.", path: ["brand"] });
            if (!data.colors) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Available colors are required.", path: ["colors"] });
            break;
    }
});

const uploadToCloudinary = async (file: File) => {
    let processedFile = file;
    const fileName = file.name.toLowerCase();

    // Check if the file is HEIC/HEIF and convert it
    if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
        try {
            const heic2any = (await import('heic2any')).default;
            const convertedBlob = await heic2any({
                blob: file,
                toType: "image/jpeg",
                quality: 0.8,
            });
            processedFile = new File([convertedBlob as Blob], `${file.name.split('.')[0]}.jpeg`, { type: 'image/jpeg' });
        } catch (error) {
            console.error('HEIC to JPEG conversion failed:', error);
            throw new Error('Failed to convert HEIC image.');
        }
    }
    
    const formData = new FormData();
    formData.append('file', processedFile);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
        console.error("Cloudinary upload failed:", data);
        throw new Error(data.error?.message || 'Upload failed');
    }
    return data.secure_url;
};


interface ProductFormProps {
    vendor: Vendor;
    existingProducts: Product[];
    editingProduct: Product | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export function ProductForm({ vendor, existingProducts, editingProduct, onSuccess, onCancel }: ProductFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: editingProduct ? {
        ...editingProduct,
        price: editingProduct.price || undefined,
        year: editingProduct.year || undefined,
        mileage: editingProduct.mileage || undefined,
        pricePerGram: editingProduct.pricePerGram || undefined,
        // Ensure optional string values are not undefined
        type: editingProduct.type || '',
        brand: editingProduct.brand || '',
        colors: editingProduct.colors || '',
        location: editingProduct.location || '',
        address: editingProduct.address || '',
        size: editingProduct.size || '',
        make: editingProduct.make || '',
        model: editingProduct.model || '',
        preciousMetalType: editingProduct.preciousMetalType || '',
        purity: editingProduct.purity || '',
        weight: editingProduct.weight || '',
        form: editingProduct.form || '',
        sourceOrigin: editingProduct.sourceOrigin || '',
        serialNumber: editingProduct.serialNumber || '',
        ram: editingProduct.ram || '',
        storage: editingProduct.storage || '',
        inches: editingProduct.inches || '',
        processorType: editingProduct.processorType || '',
        generation: editingProduct.generation || '',
        dedicatedGraphicsMemory: editingProduct.dedicatedGraphicsMemory || '',
        batteryHealth: editingProduct.batteryHealth || '',
        displayType: editingProduct.displayType || '',
        connectivity: editingProduct.connectivity || '',
        mah: editingProduct.mah || '',
        material: editingProduct.material || '',
        powerSource: editingProduct.powerSource || '',
        network: editingProduct.network || '',
        speed: editingProduct.speed || '',
        // @ts-ignore
        images: { editing: true, length: editingProduct.images?.length || 0 },
    } : {
      name: '', price: 0, condition: 'new', category: '', brand: '', type: '',
      colors: '', description: '', payOnDelivery: false, location: '',
      address: '', gender: undefined, size: '', make: '', model: '', year: undefined,
      mileage: undefined, transmission: undefined, fuelType: undefined,
      preciousMetalType: '', purity: '', weight: '', form: '',
      sourceOrigin: '', pricePerGram: undefined, assayCertificate: undefined,
      serialNumber: '', ram: '', storage: '', inches: '', processorType: '',
      generation: '', dedicatedGraphicsMemory: '', batteryHealth: '',
      displayType: '', connectivity: '', smart: false, mah: '',
      material: '', powerSource: '', network: '', speed: ''
    },
  });

  const imageRef = form.register("images");

  const selectedCategory = useWatch({ control: form.control, name: 'category' });
  const selectedImages = useWatch({ control: form.control, name: 'images' });
  const descriptionValue = useWatch({ control: form.control, name: 'description' });
  const conditionValue = useWatch({ control: form.control, name: 'condition'});
  const fileCount = selectedImages?.length || 0;
  
  const vendorProductCategories = useMemo(() => {
    if (!vendor?.categories) return [];
    return productCategories.filter(cat => vendor.categories.includes(cat.id));
  }, [vendor]);

  const imageRequirementText = useMemo(() => {
    if (editingProduct) return "(Optional: leave blank to keep existing images)";
    if (!conditionValue) return "(Select a condition first)";
    if (conditionValue === 'used') return "(min 3, max 5)";
    return "(min 1, max 5)";
  }, [conditionValue, editingProduct]);

  useEffect(() => {
    if (editingProduct) {
        form.reset({
            ...editingProduct,
             price: editingProduct.price || undefined,
             year: editingProduct.year || undefined,
             mileage: editingProduct.mileage || undefined,
             pricePerGram: editingProduct.pricePerGram || undefined,
             type: editingProduct.type || '',
             brand: editingProduct.brand || '',
             colors: editingProduct.colors || '',
             location: editingProduct.location || '',
             address: editingProduct.address || '',
             size: editingProduct.size || '',
             make: editingProduct.make || '',
             model: editingProduct.model || '',
             preciousMetalType: editingProduct.preciousMetalType || '',
             purity: editingProduct.purity || '',
             weight: editingProduct.weight || '',
             form: editingProduct.form || '',
             sourceOrigin: editingProduct.sourceOrigin || '',
             serialNumber: editingProduct.serialNumber || '',
             ram: editingProduct.ram || '',
             storage: editingProduct.storage || '',
             inches: editingProduct.inches || '',
             processorType: editingProduct.processorType || '',
             generation: editingProduct.generation || '',
             dedicatedGraphicsMemory: editingProduct.dedicatedGraphicsMemory || '',
             batteryHealth: editingProduct.batteryHealth || '',
             displayType: editingProduct.displayType || '',
             connectivity: editingProduct.connectivity || '',
             mah: editingProduct.mah || '',
             material: editingProduct.material || '',
             powerSource: editingProduct.powerSource || '',
             network: editingProduct.network || '',
             speed: editingProduct.speed || '',
             // @ts-ignore
             images: { editing: true, length: editingProduct.images.length },
        });
    } else {
        form.reset();
    }
  }, [editingProduct, form]);

  useEffect(() => {
    // When the main category changes, reset the sub-category fields
    form.setValue('type', '');
  }, [selectedCategory, form]);

  async function onSubmit(values: z.infer<typeof productFormSchema>) {
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
        toast({ variant: 'destructive', title: 'Configuration Error', description: "Image upload service is not configured. Please contact support." });
        return;
    }
    
    // Check posting limits before doing anything else
    if (!editingProduct) {
        const productsInCategory = existingProducts.filter(p => p.category === values.category).length;
        const isFreePostUsed = productsInCategory > 0;
        const hasPaidPostSlots = vendor.postLimit === -1 || vendor.postCount < vendor.postLimit;

        if (isFreePostUsed && !hasPaidPostSlots) {
             toast({
                variant: 'destructive',
                title: 'Post Limit Reached',
                description: (
                    <div>
                        You have used your free post for this category. Please{' '}
                        <Link href="/subscriptions" className="underline font-bold">
                            buy a post package
                        </Link>{' '}
                        to add more products.
                    </div>
                ),
            });
            return;
        }
    }


    setIsSubmitting(true);
    const toastAction = editingProduct ? "Updating" : "Creating";
    toast({ title: `${toastAction} Product...`, description: "Please wait while we save your product." });

    try {
        let imageUrls: string[] = editingProduct?.images || [];
        if (values.images && values.images.length > 0 && !values.images.editing) {
            const imageFiles = Array.from(values.images as FileList);
            const uploadPromises = imageFiles.map(file => uploadToCloudinary(file));
            imageUrls = await Promise.all(uploadPromises);
        }

        const productData = {
            vendorId: vendor.id,
            name: values.name,
            price: values.price || 0,
            category: values.category,
            brand: values.brand || '',
            type: values.type || '',
            description: values.description,
            images: imageUrls,
            status: 'active',
            rating: editingProduct?.rating || 0,
            reviewsCount: editingProduct?.reviewsCount || 0,
            dataAiHint: 'product photo',
            payOnDelivery: values.payOnDelivery || false,
            createdAt: editingProduct?.createdAt || serverTimestamp(),
            condition: values.condition || '',
            colors: values.colors || '',
            location: values.location || '',
            address: values.address || '',
            gender: values.gender || '',
            size: values.size || '',
            make: values.make || '',
            model: values.model || '',
            year: values.year || null,
            mileage: values.mileage || null,
            transmission: values.transmission || '',
            fuelType: values.fuelType || '',
            preciousMetalType: values.preciousMetalType || '',
            purity: values.purity || '',
            weight: values.weight || '',
            form: values.form || '',
            sourceOrigin: values.sourceOrigin || '',
            pricePerGram: values.pricePerGram || null,
            assayCertificate: values.assayCertificate || false,
            serialNumber: values.serialNumber || '',
            ram: values.ram || '',
            storage: values.storage || '',
            inches: values.inches || '',
            processorType: values.processorType || '',
            generation: values.generation || '',
            dedicatedGraphicsMemory: values.dedicatedGraphicsMemory || '',
            batteryHealth: values.batteryHealth || '',
            displayType: values.displayType || '',
            connectivity: values.connectivity || '',
            smart: values.smart || false,
            mah: values.mah || '',
            material: values.material || '',
            powerSource: values.powerSource || '',
            network: values.network || '',
            speed: values.speed || '',
        };
        

        if (editingProduct) {
            await updateDoc(doc(db, "products", editingProduct.id), productData);
        } else {
             const vendorRef = doc(db, 'vendors', vendor.id);
             const productCollectionRef = collection(db, 'products');
             
             let newProductId = '';

             await runTransaction(db, async (transaction) => {
                // Perform all reads first
                const currentVendorDoc = await transaction.get(vendorRef);
                if (!currentVendorDoc.exists()) {
                    throw new Error("Vendor does not exist!");
                }
                const currentVendor = currentVendorDoc.data() as Vendor;
                
                const productsInCategory = existingProducts.filter(p => p.category === values.category).length;
                const isPaidPost = productsInCategory > 0;

                // Now perform all writes
                const newProductRef = doc(productCollectionRef);
                newProductId = newProductRef.id;
                
                transaction.set(newProductRef, { ...productData, createdAt: serverTimestamp() });

                // Only increment post count if it's a paid post and the vendor doesn't have unlimited posts
                if(isPaidPost && currentVendor.postLimit !== -1) {
                    transaction.update(vendorRef, { postCount: increment(1) });
                }
             });
             
             await createNotification({
                recipientId: vendor.uid!,
                senderId: 'system',
                senderName: 'EliteHub',
                type: 'product_uploaded',
                productId: newProductId,
                productName: values.name,
                text: `Your product "${values.name}" has been successfully uploaded and is now active.`,
                isRead: false,
                timestamp: serverTimestamp(),
             });
        }
        
        const successAction = editingProduct ? "Updated" : "Added";
        toast({ title: `Product ${successAction} Successfully!`, description: `${values.name} is now live.` });
        onSuccess();
    } catch (error: any) {
        console.error("Error saving product:", error);
        toast({ variant: 'destructive', title: "Error", description: error.message || "Failed to save product. Please try again." });
    } finally {
        setIsSubmitting(false);
    }
  }

  const renderCategoryFields = () => {
    switch (selectedCategory) {
      case 'Automobile':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="make" render={({ field }) => ( <FormItem><FormLabel>Make</FormLabel><FormControl><Input placeholder="e.g. Toyota" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="model" render={({ field }) => ( <FormItem><FormLabel>Model</FormLabel><FormControl><Input placeholder="e.g. Camry" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="year" render={({ field }) => ( <FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" placeholder="e.g. 2022" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="mileage" render={({ field }) => ( <FormItem><FormLabel>Mileage (km)</FormLabel><FormControl><Input type="number" placeholder="e.g. 50000" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="transmission" render={({ field }) => ( <FormItem><FormLabel>Transmission</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select transmission" /></SelectTrigger><SelectContent><SelectItem value="automatic">Automatic</SelectItem><SelectItem value="manual">Manual</SelectItem></SelectContent></Select></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="fuelType" render={({ field }) => ( <FormItem><FormLabel>Fuel Type</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select fuel type" /></SelectTrigger><SelectContent><SelectItem value="petrol">Petrol</SelectItem><SelectItem value="diesel">Diesel</SelectItem><SelectItem value="electric">Electric</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem></SelectContent></Select></FormControl><FormMessage /></FormItem> )} />
            </div>
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Condition</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex items-center space-x-4 pt-2"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="new" /></FormControl>
                        <FormLabel className="font-normal">New</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="used" /></FormControl>
                        <FormLabel className="font-normal">Used</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 'Property':
        return (
          <div className="space-y-4">
            <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><FormControl><Input placeholder="e.g. For Rent, For Sale, Short-let" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Property Address</FormLabel><FormControl><Input placeholder="123 Main Street, Ikeja" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (State)</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select property state" />
                            </SelectTrigger>
                          <SelectContent>
                            {nigerianStates.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="size" render={({ field }) => ( <FormItem><FormLabel>Size (Optional)</FormLabel><FormControl><Input placeholder="e.g. 1000 sqm, 3 bedroom" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
            </div>
          </div>
        );
      case 'Fashion':
        return (
          <div className="space-y-4">
            <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><FormControl><Input placeholder="e.g. Gown, T-Shirt, Sneaker" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-wrap items-center space-x-4 pt-2"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="Men" /></FormControl>
                        <FormLabel className="font-normal">Men</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="Women" /></FormControl>
                        <FormLabel className="font-normal">Women</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="Children" /></FormControl>
                        <FormLabel className="font-normal">Children</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="Unisex" /></FormControl>
                        <FormLabel className="font-normal">Unisex</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="size" render={({ field }) => ( <FormItem><FormLabel>Size</FormLabel><FormControl><Input placeholder="e.g. M, L, XL, 42, 10" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="colors" render={({ field }) => ( <FormItem><FormLabel>Available Colors</FormLabel><FormControl><Input placeholder="e.g. Red, Blue, Green" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Condition</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex items-center space-x-4 pt-2"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="new" /></FormControl>
                        <FormLabel className="font-normal">New</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="thrift" /></FormControl>
                        <FormLabel className="font-normal">Thrift</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 'Precious Metals & Minerals':
         return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="preciousMetalType" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><FormControl><Input placeholder="e.g. Gold, Diamond" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="purity" render={({ field }) => ( <FormItem><FormLabel>Purity (Optional)</FormLabel><FormControl><Input placeholder="e.g. 24K, VVS1" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="weight" render={({ field }) => ( <FormItem><FormLabel>Weight</FormLabel><FormControl><Input placeholder="e.g. 10g, 0.5 carat" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="form" render={({ field }) => ( <FormItem><FormLabel>Form</FormLabel><FormControl><Input placeholder="e.g. Bar, Raw, Ring" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="sourceOrigin" render={({ field }) => ( <FormItem><FormLabel>Source/Origin</FormLabel><FormControl><Input placeholder="e.g. South Africa, Local" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="pricePerGram" render={({ field }) => ( <FormItem><FormLabel>Price Per Gram/Carat (₦) (Optional)</FormLabel><FormControl><Input type="number" placeholder="70000" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Condition (Optional)</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex items-center space-x-4 pt-2"
                            >
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="new" /></FormControl>
                                <FormLabel className="font-normal">New</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="used" /></FormControl>
                                <FormLabel className="font-normal">Used</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                        control={form.control}
                        name="assayCertificate"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Assay Certificate (Optional)</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={(val) => field.onChange(val === 'true')}
                                defaultValue={String(field.value)}
                                className="flex items-center space-x-4 pt-2"
                              >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl><RadioGroupItem value="true" /></FormControl>
                                  <FormLabel className="font-normal">Yes</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl><RadioGroupItem value="false" /></FormControl>
                                  <FormLabel className="font-normal">No</FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                 </div>
                  <FormField control={form.control} name="serialNumber" render={({ field }) => ( <FormItem><FormLabel>Serial Number (Optional)</FormLabel><FormControl><Input placeholder="e.g. 12345ABC" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
            </div>
        );
      case 'Computers':
        return (
          <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="brand" render={({ field }) => ( <FormItem><FormLabel>Brand</FormLabel><FormControl><Input placeholder="e.g. Apple, HP, Dell" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><FormControl><Input placeholder="e.g. Laptop, Desktop" {...field} /></FormControl><FormMessage /></FormItem> )} />
             </div>
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Condition</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex items-center space-x-4 pt-2"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="new" /></FormControl>
                        <FormLabel className="font-normal">Brand New</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="used" /></FormControl>
                        <FormLabel className="font-normal">Used</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="ram" render={({ field }) => ( <FormItem><FormLabel>RAM</FormLabel><FormControl><Input placeholder="e.g. 16GB" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="storage" render={({ field }) => ( <FormItem><FormLabel>Storage</FormLabel><FormControl><Input placeholder="e.g. 512GB SSD" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="inches" render={({ field }) => ( <FormItem><FormLabel>Screen Size (Inches)</FormLabel><FormControl><Input placeholder="e.g. 15.6" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="processorType" render={({ field }) => ( <FormItem><FormLabel>Processor Type</FormLabel><FormControl><Input placeholder="e.g. Intel Core i7" {...field} /></FormControl><FormMessage /></FormItem> )} />
             </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="year" render={({ field }) => ( <FormItem><FormLabel>Year (Optional)</FormLabel><FormControl><Input type="number" placeholder="e.g. 2023" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="generation" render={({ field }) => ( <FormItem><FormLabel>Generation (Optional)</FormLabel><FormControl><Input placeholder="e.g. 13th Gen" {...field} /></FormControl><FormMessage /></FormItem> )} />
             </div>
             <FormField control={form.control} name="dedicatedGraphicsMemory" render={({ field }) => ( <FormItem><FormLabel>Graphics Memory (Optional)</FormLabel><FormControl><Input placeholder="e.g. 8GB GDDR6" {...field} /></FormControl><FormMessage /></FormItem> )} />
          </div>
        );
       case 'Mobile Phones':
        return (
          <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="brand" render={({ field }) => ( <FormItem><FormLabel>Brand</FormLabel><FormControl><Input placeholder="e.g. Apple, Samsung" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><FormControl><Input placeholder="e.g. Smartphone" {...field} /></FormControl><FormMessage /></FormItem> )} />
             </div>
             <FormField control={form.control} name="model" render={({ field }) => ( <FormItem><FormLabel>Model</FormLabel><FormControl><Input placeholder="e.g. iPhone 15 Pro" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Condition</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex items-center space-x-4 pt-2"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="new" /></FormControl>
                        <FormLabel className="font-normal">Brand New</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="used" /></FormControl>
                        <FormLabel className="font-normal">Used</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="storage" render={({ field }) => ( <FormItem><FormLabel>Storage</FormLabel><FormControl><Input placeholder="e.g. 128GB" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="ram" render={({ field }) => ( <FormItem><FormLabel>RAM</FormLabel><FormControl><Input placeholder="e.g. 8GB" {...field} /></FormControl><FormMessage /></FormItem> )} />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="colors" render={({ field }) => ( <FormItem><FormLabel>Available Colors</FormLabel><FormControl><Input placeholder="e.g. Titanium Blue, Black" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="batteryHealth" render={({ field }) => ( <FormItem><FormLabel>Battery Health (Optional)</FormLabel><FormControl><Input placeholder="e.g. 98%" {...field} /></FormControl><FormMessage /></FormItem> )} />
             </div>
          </div>
        );
      case 'Electronics':
        return (
           <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="brand" render={({ field }) => ( <FormItem><FormLabel>Brand</FormLabel><FormControl><Input placeholder="e.g. Samsung, Sony" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><FormControl><Input placeholder="e.g. Television, Speaker" {...field} /></FormControl><FormMessage /></FormItem> )} />
             </div>
             <FormField control={form.control} name="model" render={({ field }) => ( <FormItem><FormLabel>Model (Optional)</FormLabel><FormControl><Input placeholder="e.g. QN90C" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Condition</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex items-center space-x-4 pt-2"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="new" /></FormControl>
                        <FormLabel className="font-normal">Brand New</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="used" /></FormControl>
                        <FormLabel className="font-normal">Used</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="displayType" render={({ field }) => ( <FormItem><FormLabel>Display Type (Optional)</FormLabel><FormControl><Input placeholder="e.g. OLED, QLED, LCD" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="inches" render={({ field }) => ( <FormItem><FormLabel>Screen Size (Inches, Optional)</FormLabel><FormControl><Input placeholder="e.g. 65" {...field} /></FormControl><FormMessage /></FormItem> )} />
             </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="year" render={({ field }) => ( <FormItem><FormLabel>Year (Optional)</FormLabel><FormControl><Input type="number" placeholder="e.g. 2023" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="connectivity" render={({ field }) => ( <FormItem><FormLabel>Connectivity (Optional)</FormLabel><FormControl><Input placeholder="e.g. Bluetooth, Wi-Fi" {...field} /></FormControl><FormMessage /></FormItem> )} />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="colors" render={({ field }) => ( <FormItem><FormLabel>Color (Optional)</FormLabel><FormControl><Input placeholder="e.g. Black" {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField
                  control={form.control}
                  name="smart"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Smart Device? (Optional)</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(val) => field.onChange(val === 'true')}
                          defaultValue={String(field.value)}
                          className="flex items-center space-x-4 pt-2"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="true" /></FormControl>
                            <FormLabel className="font-normal">Yes</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="false" /></FormControl>
                            <FormLabel className="font-normal">No</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>
          </div>
        );
      case 'Accessories':
        return (
          <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="brand" render={({ field }) => ( <FormItem><FormLabel>Brand</FormLabel><FormControl><Input placeholder="e.g. Apple, Anker" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><FormControl><Input placeholder="e.g. Smartwatch, Power Bank" {...field} /></FormControl><FormMessage /></FormItem> )} />
             </div>
             <FormField control={form.control} name="model" render={({ field }) => ( <FormItem><FormLabel>Model (Optional)</FormLabel><FormControl><Input placeholder="e.g. Watch Series 9" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Condition</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex items-center space-x-4 pt-2"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="new" /></FormControl>
                        <FormLabel className="font-normal">Brand New</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="used" /></FormControl>
                        <FormLabel className="font-normal">Used</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="colors" render={({ field }) => ( <FormItem><FormLabel>Available Colors</FormLabel><FormControl><Input placeholder="e.g. Midnight, Starlight" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="connectivity" render={({ field }) => ( <FormItem><FormLabel>Connectivity (Optional)</FormLabel><FormControl><Input placeholder="e.g. Bluetooth, Wi-Fi" {...field} /></FormControl><FormMessage /></FormItem> )} />
             </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField control={form.control} name="size" render={({ field }) => ( <FormItem><FormLabel>Size (Optional)</FormLabel><FormControl><Input placeholder="e.g. 45mm" {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="mah" render={({ field }) => ( <FormItem><FormLabel>Capacity (mAh, Optional)</FormLabel><FormControl><Input placeholder="e.g. 10000" {...field} /></FormControl><FormMessage /></FormItem> )} />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="weight" render={({ field }) => ( <FormItem><FormLabel>Weight (Optional)</FormLabel><FormControl><Input placeholder="e.g. 200g" {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField
                  control={form.control}
                  name="smart"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Smart Device? (Optional)</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(val) => field.onChange(val === 'true')}
                          defaultValue={String(field.value)}
                          className="flex items-center space-x-4 pt-2"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="true" /></FormControl>
                            <FormLabel className="font-normal">Yes</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="false" /></FormControl>
                            <FormLabel className="font-normal">No</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>
          </div>
        );
      case 'Gaming':
        return (
           <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="brand" render={({ field }) => ( <FormItem><FormLabel>Brand</FormLabel><FormControl><Input placeholder="e.g. Sony, Microsoft" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><FormControl><Input placeholder="e.g. Console, Controller" {...field} /></FormControl><FormMessage /></FormItem> )} />
             </div>
             <FormField control={form.control} name="model" render={({ field }) => ( <FormItem><FormLabel>Model (Optional)</FormLabel><FormControl><Input placeholder="e.g. PlayStation 5, Xbox Series X" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Condition</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex items-center space-x-4 pt-2"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="new" /></FormControl>
                        <FormLabel className="font-normal">Brand New</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="used" /></FormControl>
                        <FormLabel className="font-normal">Used</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="colors" render={({ field }) => ( <FormItem><FormLabel>Color</FormLabel><FormControl><Input placeholder="e.g. White, Black" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="connectivity" render={({ field }) => ( <FormItem><FormLabel>Connectivity (Optional)</FormLabel><FormControl><Input placeholder="e.g. Bluetooth, Wireless" {...field} /></FormControl><FormMessage /></FormItem> )} />
             </div>
          </div>
        );
      case 'Furniture':
        return (
          <div className="space-y-4">
            <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><FormControl><Input placeholder="e.g. Sofa, Bed Frame, Dining Table" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="brand" render={({ field }) => ( <FormItem><FormLabel>Brand (Optional)</FormLabel><FormControl><Input placeholder="e.g. Lifemate, Vono" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="size" render={({ field }) => ( <FormItem><FormLabel>Size (Optional)</FormLabel><FormControl><Input placeholder="e.g. 6x6, 3-Seater" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <FormField control={form.control} name="colors" render={({ field }) => ( <FormItem><FormLabel>Colours (Optional)</FormLabel><FormControl><Input placeholder="e.g. Brown, Grey" {...field} /></FormControl><FormMessage /></FormItem> )} />
          </div>
        );
      case 'Home Goods':
        return (
          <div className="space-y-4">
            <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><FormControl><Input placeholder="e.g. Bedding Set, Wall Art, Rug" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="model" render={({ field }) => ( <FormItem><FormLabel>Model (Optional)</FormLabel><FormControl><Input placeholder="e.g. Egyptian Cotton" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="colors" render={({ field }) => ( <FormItem><FormLabel>Colours (Optional)</FormLabel><FormControl><Input placeholder="e.g. White, Beige" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="size" render={({ field }) => ( <FormItem><FormLabel>Size (Optional)</FormLabel><FormControl><Input placeholder="e.g. Queen, 24x36 inches" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField
                  control={form.control}
                  name="smart"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Smart Device? (Optional)</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(val) => field.onChange(val === 'true')}
                          defaultValue={String(field.value)}
                          className="flex items-center space-x-4 pt-2"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="true" /></FormControl>
                            <FormLabel className="font-normal">Yes</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="false" /></FormControl>
                            <FormLabel className="font-normal">No</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
          </div>
        );
      case 'Kitchenware':
        return (
            <div className="space-y-4">
                <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><FormControl><Input placeholder="e.g. Blender, Cookware Set" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Condition</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex items-center space-x-4 pt-2"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="new" /></FormControl>
                            <FormLabel className="font-normal">New</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="used" /></FormControl>
                            <FormLabel className="font-normal">Used</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="brand" render={({ field }) => ( <FormItem><FormLabel>Brand (Optional)</FormLabel><FormControl><Input placeholder="e.g. MasterChef, Scanfrost" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="colors" render={({ field }) => ( <FormItem><FormLabel>Colours (Optional)</FormLabel><FormControl><Input placeholder="e.g. Silver, Black" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="material" render={({ field }) => ( <FormItem><FormLabel>Material (Optional)</FormLabel><FormControl><Input placeholder="e.g. Glass, Stainless, Rubber" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="powerSource" render={({ field }) => ( <FormItem><FormLabel>Power Source (Optional)</FormLabel><FormControl><Input placeholder="e.g. Electric" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                 <FormField control={form.control} name="size" render={({ field }) => ( <FormItem><FormLabel>Size/Capacity (Optional)</FormLabel><FormControl><Input placeholder="e.g. 1.5L, 12-piece" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
        );
      case 'Agriculture':
        return (
            <div className="space-y-4">
                <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><FormControl><Input placeholder="e.g. Fertilizer, Seed, Equipment" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="brand" render={({ field }) => ( <FormItem><FormLabel>Brand (Optional)</FormLabel><FormControl><Input placeholder="e.g. Notore, John Deere" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="weight" render={({ field }) => ( <FormItem><FormLabel>Weight (kg, Optional)</FormLabel><FormControl><Input placeholder="e.g. 50kg, 1 ton" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="colors" render={({ field }) => ( <FormItem><FormLabel>Color (Optional)</FormLabel><FormControl><Input placeholder="e.g. Brown" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Condition (Optional)</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex items-center space-x-4 pt-2"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="new" /></FormControl>
                            <FormLabel className="font-normal">New</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="used" /></FormControl>
                            <FormLabel className="font-normal">Used</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
        );
      case 'Cosmetics':
          return (
            <div className="space-y-4">
              <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><FormControl><Input placeholder="e.g. Lipstick, Foundation, Serum" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="brand" render={({ field }) => ( <FormItem><FormLabel>Brand (Optional)</FormLabel><FormControl><Input placeholder="e.g. Fenty Beauty, MAC" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="size" render={({ field }) => ( <FormItem><FormLabel>Size (Optional)</FormLabel><FormControl><Input placeholder="e.g. 50ml, 1oz" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <FormField control={form.control} name="colors" render={({ field }) => ( <FormItem><FormLabel>Colours/Shade (Optional)</FormLabel><FormControl><Input placeholder="e.g. Ruby Woo, 498" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
          );
      case 'Internet Providers':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><FormControl><Input placeholder="e.g. Modem, Router, MiFi" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="model" render={({ field }) => ( <FormItem><FormLabel>Model</FormLabel><FormControl><Input placeholder="e.g. ZLT S10G, CPE 5G" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="network" render={({ field }) => ( <FormItem><FormLabel>Network</FormLabel><FormControl><Input placeholder="e.g. MTN, Glo, Spectranet" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="speed" render={({ field }) => ( <FormItem><FormLabel>Speed (Optional)</FormLabel><FormControl><Input placeholder="e.g. 150Mbps, 1Gbps" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <FormField control={form.control} name="colors" render={({ field }) => ( <FormItem><FormLabel>Colours (Optional)</FormLabel><FormControl><Input placeholder="e.g. Black, White" {...field} /></FormControl><FormMessage /></FormItem> )} />
          </div>
        );
    case 'Groceries':
        return (
          <div className="space-y-4">
            <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><FormControl><Input placeholder="e.g. Rice, Beans, Palm Oil" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="weight" render={({ field }) => ( <FormItem><FormLabel>Weight (kg, Optional)</FormLabel><FormControl><Input placeholder="e.g. 50kg, 25L" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="sourceOrigin" render={({ field }) => ( <FormItem><FormLabel>Origin (Optional)</FormLabel><FormControl><Input placeholder="e.g. Ofada, Abakaliki" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
          </div>
        );
      case '':
      case null:
      case undefined:
        return null; // No category selected yet
      default: // Default fields for all other physical goods
        return (
          <div className="space-y-4">
             <FormField control={form.control} name="brand" render={({ field }) => ( <FormItem><FormLabel>Brand</FormLabel><FormControl><Input placeholder="e.g. Apple, Nike" {...field} /></FormControl><FormMessage /></FormItem> )} />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="colors" render={({ field }) => ( <FormItem><FormLabel>Available Colors</FormLabel><FormControl><Input placeholder="e.g. Red, Blue, Green" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Condition</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex items-center space-x-4 pt-2"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="new" /></FormControl>
                            <FormLabel className="font-normal">New</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="used" /></FormControl>
                            <FormLabel className="font-normal">Used</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>
          </div>
        );
    }
  }

  return (
    <div className="flex flex-col flex-grow min-h-0">
      <DialogHeader>
        <DialogTitle>{editingProduct ? "Edit Product" : "Add a New Product"}</DialogTitle>
        <DialogDescription>
          {editingProduct ? "Update the details for your product." : "Fill out the details below to list a new product in your store."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow min-h-0">
          <div className="flex-grow overflow-y-auto space-y-4 px-6">
            {/* Common Fields */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      <SelectContent>
                        {vendorProductCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder='Name' {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>Price (₦) {selectedCategory === 'Precious Metals & Minerals' && <span className="text-muted-foreground text-xs">(Optional)</span>}</FormLabel><FormControl><Input type="number" placeholder="5000" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
            
            <FormField control={form.control} name="description" render={({ field }) => ( 
                <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                        <Textarea 
                            placeholder="Describe the product's features, materials, etc." 
                            rows={5} 
                            maxLength={300}
                            {...field} 
                        />
                    </FormControl>
                    <div className="text-right text-xs text-muted-foreground">
                       <span className={cn( (descriptionValue?.length || 0) > 300 && "text-destructive" )}>
                         {descriptionValue?.length || 0}
                       </span> / 300
                    </div>
                    <FormMessage />
                </FormItem> 
            )} />

            <FormField control={form.control} name="images" render={({ field }) => ( <FormItem><FormLabel>Product Images <span className="text-muted-foreground text-xs">{imageRequirementText}</span></FormLabel><FormControl><Input type="file" accept="image/*,.heic,.heif" multiple {...imageRef} /></FormControl>{fileCount > 0 && (<div className="text-sm text-muted-foreground flex items-center gap-2"><Paperclip className="h-4 w-4" /><span>{fileCount} image(s) selected.</span></div>)}<FormMessage /></FormItem> )} />
            
            {/* Dynamic Category-Specific Fields */}
            {selectedCategory && (
                <div className="space-y-4 pt-4 mt-4 border-t">
                    <h3 className="font-medium text-lg">{selectedCategory} Details</h3>
                    {renderCategoryFields()}
                </div>
            )}
            
            {selectedCategory && selectedCategory !== 'Property' && (
              <FormField
                control={form.control}
                name="payOnDelivery"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Accept Pay on Delivery in my location
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            )}
          </div>
          {/* Sticky footer */}
          <div className="flex-shrink-0 p-6 border-t flex justify-end gap-2 bg-background">
            <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
