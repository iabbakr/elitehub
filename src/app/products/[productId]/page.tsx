
import { notFound } from 'next/navigation';
import { fetchProductById, fetchProducts, fetchVendorById, type Product, type Vendor } from '@/lib/data';
import type { Metadata } from 'next';
import { ProductClientPage } from './ProductClientPage';

export async function generateStaticParams() {
  const products = await fetchProducts();
  return products.map((product) => ({
    productId: product.id,
  }));
}

export async function generateMetadata({ params }: { params: { productId: string } }): Promise<Metadata> {
  const product = await fetchProductById(params.productId);

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The product you are looking for does not exist.',
    };
  }

  const shortDescription = product.description.substring(0, 155);

  return {
    title: `${product.name} | EliteHub Marketplace`,
    description: shortDescription,
    keywords: [product.name, product.category, product.brand || '', 'buy online nigeria'],
    openGraph: {
      title: product.name,
      description: shortDescription,
      images: [
        {
          url: product.images[0],
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
      url: `https://www.elitehubng.com/products/${product.id}`,
      siteName: 'EliteHub Marketplace',
      type: 'website',
    },
    alternates: {
      canonical: `https://www.elitehubng.com/products/${product.id}`,
    },
  };
}


export default async function ProductDetailPage({ params }: { params: { productId: string } }) {
  const product = await fetchProductById(params.productId);
  
  if (!product) {
    notFound();
  }
  
  // Fetch vendor separately, as the client component will need it.
  const vendor = await fetchVendorById(product.vendorId);
  
  // Fetch related products here on the server
  // In a real app, this might be a more complex query
  const allProducts = await fetchProducts();
  const relatedProducts = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  return <ProductClientPage initialProduct={product} initialVendor={vendor} initialRelatedProducts={relatedProducts} />;
}
