
import { collection, getDocs, doc, getDoc, query, where, addDoc, serverTimestamp, orderBy, increment, limit, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

export type Product = {
  id: string;
  name: string;
  price?: number;
  images: string[];
  vendorId: string;
  category: string;
  description: string;
  status: 'active' | 'closed';
  rating: number;
  reviewsCount: number;
  dataAiHint: string;
  payOnDelivery?: boolean;
  viewCount?: number;
  favoriteCount?: number;
  boostedUntil?: string; // ISO date string
  createdAt?: any;
  
  // General optional fields
  brand?: string;
  type?: string;
  condition?: 'new' | 'used' | 'thrift';
  colors?: string;

  // Property specific
  location?: string;
  address?: string;
  size?: string;

  // Fashion specific
  gender?: 'Men' | 'Women' | 'Children' | 'Unisex';

  // Automobile specific
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  transmission?: 'automatic' | 'manual';
  fuelType?: 'petrol' | 'diesel' | 'electric' | 'hybrid';

  // Precious Metals & Minerals specific
  preciousMetalType?: string;
  purity?: string;
  weight?: string;
  form?: string;
  sourceOrigin?: string;
  pricePerGram?: number;
  assayCertificate?: boolean;
  serialNumber?: string;

  // Service-based
  serviceArea?: string;
  serviceCategory?: string;

  // Computer specific
  ram?: string;
  storage?: string;
  inches?: string;
  processorType?: string;
  generation?: string;
  dedicatedGraphicsMemory?: string;
  
  // Mobile Phone specific
  batteryHealth?: string;

  // Electronics specific
  displayType?: string;
  connectivity?: string;
  smart?: boolean;

  // Accessories specific
  mah?: string;
  
  // Kitchenware specific
  material?: string;
  powerSource?: string;

  // Internet Provider specific
  network?: string;
  speed?: string;
};

export type Vendor = {
  id: string;
  name: string;
  fullname: string;
  email: string;
  phoneNumber: string;
  whatsappNumber?: string;
  whatsappNumberLastUpdated?: any;
  address: string;
  city: string;
  location: string;
  trustLevel: number;
  referralChain: string[]; // Kept for historical/future use, but new logic uses referrals field.
  referralCode: string;
  rcNumber?: string;
  memberSince: string;
  profileImage: string;
  bannerImage: string;
  dataAiHint: string;
  businessDescription: string;
  rating: number;
  ratingCount?: number;
  totalRating?: number;
  isVerified: boolean;
  status: 'active' | 'banned';
  badgeExpirationDate: string | null;
  postLimit: number; // -1 for unlimited
  postCount: number;
  adBoosts: number;
  uid?: string; // Optional UID from Firebase Auth
  tier?: 'vip' | 'vvip';
  categories: string[];
  profileViews?: number;
  referrals: string[]; // Array of referred vendor IDs.
  claimedReferralTiers: number[]; // Array of counts for claimed tiers (e.g., [10, 50]).
  notifiedViewMilestones?: number[];
  kycStatus: 'pending' | 'verified' | 'rejected' | 'none';
  idCardFront?: string;
  idCardBack?: string;
  passportPhoto?: string;
  nin?: string;
};

export type Lawyer = {
    id: string;
    uid: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    whatsappNumber?: string;
    whatsappNumberLastUpdated?: any;
    scn: string;
    tagline: string;
    bio: string;
    city: string;
    location: string;
    yearsOfExperience: number;
    practiceAreas: string[];
    profileImage: string;
    status: 'pending' | 'approved' | 'rejected' | 'active' | 'banned';
    rating: number;
    ratingCount: number;
    totalRating: number;
    profileVisibleUntil: string | null;
    isVerified: boolean;
    badgeExpirationDate: string | null;
    tier: 'vip' | 'vvip' | null;
    kycStatus: 'pending' | 'verified' | 'rejected' | 'none';
    idCardFront?: string;
    idCardBack?: string;
    passportPhoto?: string;
    nin?: string;
};

export type LawyerApplication = Omit<Lawyer, 'id' | 'rating' | 'ratingCount' | 'totalRating' | 'profileVisibleUntil' | 'isVerified' | 'badgeExpirationDate' | 'tier' | 'kycStatus'> & {
    id: string;
    submittedAt: any;
    idCardFront?: string;
    idCardBack?: string;
    passportPhoto?: string;
    nin?: string;
};

export type CurrencyExchangeAgent = {
    id: string;
    uid: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    whatsappNumber?: string;
    whatsappNumberLastUpdated?: any;
    businessName: string;
    bio: string;
    city: string;
    location: string;
    profileImage: string;
    status: 'pending' | 'approved' | 'rejected' | 'active' | 'banned';
    rating: number;
    ratingCount: number;
    totalRating: number;
    currenciesAccepted: ('Fiat' | 'Crypto')[];
    transactionTypes: string[];
    operatesOnline: boolean;
    hasPhysicalLocation: boolean;
    address?: string;
    galleryImages?: string[];
    profileVisibleUntil: string | null;
    galleryActiveUntil: string | null;
    isVerified: boolean;
    badgeExpirationDate: string | null;
    tier: 'vip' | 'vvip' | null;
    kycStatus: 'pending' | 'verified' | 'rejected' | 'none';
    idCardFront?: string;
    idCardBack?: string;
    passportPhoto?: string;
    nin?: string;
};

export type CurrencyExchangeApplication = Omit<CurrencyExchangeAgent, 'id' | 'rating' | 'ratingCount' | 'totalRating' | 'profileVisibleUntil' | 'galleryActiveUntil' | 'isVerified' | 'badgeExpirationDate' | 'tier' | 'kycStatus'> & {
    id: string;
    submittedAt: any;
    idCardFront?: string;
    idCardBack?: string;
    passportPhoto?: string;
    nin?: string;
};

export type LogisticsCompany = {
    id: string;
    uid: string;
    name: string;
    email: string;
    phoneNumber: string;
    whatsappNumber?: string;
    whatsappNumberLastUpdated?: any;
    rcNumber?: string;
    bio: string;
    city: string;
    location: string;
    address: string;
    profileImage: string;
    status: 'pending' | 'approved' | 'rejected' | 'active' | 'banned';
    rating: number;
    ratingCount: number;
    totalRating: number;
    category: string; // New field
    galleryImages?: string[];
    profileVisibleUntil: string | null;
    galleryActiveUntil: string | null;
    isVerified: boolean;
    badgeExpirationDate: string | null;
    tier: 'vip' | 'vvip' | null;
    boostedUntil: string | null;
    kycStatus: 'pending' | 'verified' | 'rejected' | 'none';
    idCardFront?: string;
    idCardBack?: string;
    passportPhoto?: string;
    nin?: string;
};

export type LogisticsApplication = Omit<LogisticsCompany, 'id' | 'rating' | 'ratingCount' | 'totalRating' | 'profileVisibleUntil' | 'galleryActiveUntil' | 'isVerified' | 'badgeExpirationDate' | 'tier' | 'boostedUntil' | 'kycStatus'> & {
    id: string;
    submittedAt: any;
    idCardFront?: string;
    idCardBack?: string;
    passportPhoto?: string;
    nin?: string;
};

export type ServiceProvider = {
    id: string;
    uid: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    whatsappNumber?: string;
    whatsappNumberLastUpdated?: any;
    businessName: string;
    rcNumber?: string;
    bio: string;
    city: string;
    location: string;
    profileImage: string;
    status: 'pending' | 'approved' | 'rejected' | 'active' | 'banned';
    rating: number;
    ratingCount: number;
    totalRating: number;
    serviceCategory: string;
    serviceType: string;
    operatesOnline: boolean;
    hasPhysicalLocation: boolean;
    address?: string;
    galleryImages?: string[];
    profileVisibleUntil: string | null;
    galleryActiveUntil: string | null;
    isVerified: boolean;
    badgeExpirationDate: string | null;
    tier: 'vip' | 'vvip' | null;
    boostedUntil: string | null;
    kycStatus: 'pending' | 'verified' | 'rejected' | 'none';
    idCardFront?: string;
    idCardBack?: string;
    passportPhoto?: string;
    nin?: string;
};

export type ServiceProviderApplication = Omit<ServiceProvider, 'id' | 'rating' | 'ratingCount' | 'totalRating' | 'profileVisibleUntil' | 'galleryActiveUntil' | 'isVerified' | 'badgeExpirationDate' | 'tier' | 'boostedUntil' | 'kycStatus'> & {
    id: string;
    submittedAt: any;
    idCardFront?: string;
    idCardBack?: string;
    passportPhoto?: string;
    nin?: string;
};


export type UserData = {
    id: string;
    uid: string;
    fullName: string;
    email: string;
    createdAt: string;
    lastLogin?: string | null;
};

export type Reply = {
  id: string;
  authorId: string;
  authorName: string;
  authorImage?: string; // Optional
  text: string;
  timestamp: any;
};

export type Review = {
  id: string;
  authorId: string;
  authorName: string;
  authorImage?: string; // Optional
  rating: number;
  comment: string;
  timestamp: any;
  replies?: Reply[]; // Will be fetched separately
};


export type VendorApplication = {
  id:string;
  vendorName: string;
  email: string;
  referralCode?: string;
  status: 'pending' | 'approved' | 'rejected';
  // Add other fields from the registration form
  fullName: string;
  phoneNumber: string;
  whatsappNumber?: string;
  username: string;
  location: string;
  city: string;
  rcNumber?: string;
  businessDescription: string;
  uid: string;
  submittedAt: any;
  address: string;
  categories: string[];
  idCardFront?: string;
  idCardBack?: string;
  passportPhoto?: string;
  nin?: string;
};

export type Order = {
  id: string;
  date: string;
  total: number;
  status: 'Delivered' | 'Shipped' | 'Pending';
  userId: string;
};

export type Transaction = {
  id: string;
  vendorId: string; // Can be vendorId or providerId
  description: string;
  amount: number;
  status: 'successful';
  timestamp: any;
  providerType: 'vendor' | 'service' | 'lawyer' | 'currency-exchange' | 'logistics';
}

export type Notification = {
    id: string;
    recipientId: string;
    senderId: string;
    senderName: string;
    type: 'review' | 'reply' | 'application_approved' | 'kyc_approved' | 'kyc_rejected' | 'product_uploaded' | 'product_status_changed' | 'product_deleted' | 'product_boosted' | 'profile_view_milestone';
    productId?: string;
    productName?: string;
    text: string;
    isRead: boolean;
    timestamp: any;
}

export type FilterState = {
  location: string;
  category: string;
  vendor: string;
  brand: string;
  product: string;
};

export async function createNotification(notification: Omit<Notification, 'id'>) {
    try {
        await addDoc(collection(db, 'notifications'), notification);
    } catch (error) {
        console.error("Error creating notification:", error);
    }
}


// --- Firestore Data Fetching Functions ---

export async function fetchUsers(): Promise<UserData[]> {
  try {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate().toISOString() || null,
            lastLogin: data.lastLogin?.toDate().toISOString() || null
        } as UserData;
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function fetchServiceProviders(category?: string): Promise<ServiceProvider[]> {
  try {
    const providersCollection = collection(db, 'serviceProviders');
    let q;
    if (category) {
        q = query(providersCollection, where("serviceCategory", "==", category));
    } else {
        q = query(providersCollection);
    }
    const snapshot = await getDocs(q);
    const now = new Date();
    return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() })) as ServiceProvider[];
  } catch (error) {
    console.error("Error fetching service providers:", error);
    return [];
  }
}

export async function fetchServiceProvidersBySubCategory(category: string, subCategory: string): Promise<ServiceProvider[]> {
  try {
    const providersCollection = collection(db, 'serviceProviders');
    const q = query(providersCollection, 
        where("status", "==", "active"),
        where("serviceCategory", "==", category),
        where("serviceType", "==", subCategory)
    );
    const snapshot = await getDocs(q);
    const now = new Date();
    const providers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() })) as ServiceProvider[];
    return providers.filter(p => p.profileVisibleUntil && new Date(p.profileVisibleUntil) > now);
  } catch (error) {
    console.error("Error fetching service providers by sub-category:", error);
    return [];
  }
}


export async function fetchServiceProviderById(id: string): Promise<ServiceProvider | null> {
  try {
    const docRef = doc(db, 'serviceProviders', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ServiceProvider;
    }
    return null;
  } catch (error) {
    console.error("Error fetching service provider by ID:", error);
    return null;
  }
}


export async function fetchLogisticsCompanies(category?: string): Promise<LogisticsCompany[]> {
  try {
    const logisticsCollection = collection(db, 'logisticsCompanies');
    let q;
    if (category) {
        q = query(logisticsCollection, where("category", "==", category));
    } else {
        q = query(logisticsCollection);
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LogisticsCompany[];
  } catch (error) {
    console.error("Error fetching logistics companies:", error);
    return [];
  }
}

export async function fetchLogisticsCompanyById(id: string): Promise<LogisticsCompany | null> {
  try {
    const docRef = doc(db, 'logisticsCompanies', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as LogisticsCompany;
    }
    return null;
  } catch (error) {
    console.error("Error fetching logistics company by ID:", error);
    return null;
  }
}

export async function fetchCurrencyExchangeAgents(): Promise<CurrencyExchangeAgent[]> {
  try {
    const agentsCollection = collection(db, 'currencyExchangeAgents');
    const agentSnapshot = await getDocs(agentsCollection);
    return agentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CurrencyExchangeAgent[];
  } catch (error) {
    console.error("Error fetching currency exchange agents:", error);
    return [];
  }
}

export async function fetchCurrencyExchangeAgentById(id: string): Promise<CurrencyExchangeAgent | null> {
  try {
    const agentDocRef = doc(db, 'currencyExchangeAgents', id);
    const agentDoc = await getDoc(agentDocRef);
    if (agentDoc.exists()) {
      return { id: agentDoc.id, ...agentDoc.data() } as CurrencyExchangeAgent;
    }
    return null;
  } catch (error) {
    console.error("Error fetching currency exchange agent by ID:", error);
    return null;
  }
}


export async function fetchLawyers(): Promise<Lawyer[]> {
  try {
    const lawyersCollection = collection(db, 'lawyers');
    const lawyerSnapshot = await getDocs(lawyersCollection);
    return lawyerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Lawyer[];
  } catch (error) {
    console.error("Error fetching lawyers:", error);
    return [];
  }
}

export async function fetchLawyerById(id: string): Promise<Lawyer | null> {
  try {
    const lawyerDocRef = doc(db, 'lawyers', id);
    const lawyerDoc = await getDoc(lawyerDocRef);
    if (lawyerDoc.exists()) {
      return { id: lawyerDoc.id, ...lawyerDoc.data() } as Lawyer;
    }
    return null;
  } catch (error) {
    console.error("Error fetching lawyer by ID:", error);
    return null;
  }
}


export async function fetchVendors(): Promise<Vendor[]> {
  try {
    const vendorsCollection = collection(db, 'vendors');
    const vendorSnapshot = await getDocs(vendorsCollection);
    return vendorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Vendor[];
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
}

export async function fetchVendorById(id: string): Promise<Vendor | null> {
  try {
    // First, try to get by document ID
    const vendorDocRef = doc(db, 'vendors', id);
    const vendorDoc = await getDoc(vendorDocRef);
    if (vendorDoc.exists()) {
      return { id: vendorDoc.id, ...vendorDoc.data() } as Vendor;
    }
    
    // If not found by ID, try to find by UID, as some old records might use UID as ID
    const vendorsByUid = await fetchVendorByUid(id);
    if(vendorsByUid) return vendorsByUid;

    return null;
  } catch (error) {
    console.error("Error fetching vendor by ID:", error);
    return null;
  }
}

export async function fetchVendorByUid(uid: string): Promise<Vendor | null> {
    try {
        const q = query(collection(db, "vendors"), where("uid", "==", uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const vendorDoc = querySnapshot.docs[0];
            return { id: vendorDoc.id, ...vendorDoc.data() } as Vendor;
        }
        return null;
    } catch (error) {
        console.error("Error fetching vendor by UID:", error);
        return null;
    }
}

export async function fetchUserByUid(uid: string): Promise<UserData | null> {
    try {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const data = userDoc.data();
            return {
                id: userDoc.id,
                ...data,
                createdAt: data.createdAt?.toDate().toISOString() || null,
                lastLogin: data.lastLogin?.toDate().toISOString() || null
            } as UserData;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user by UID:", error);
        return null;
    }
}


export async function fetchProducts(): Promise<Product[]> {
    try {
        const productsCollection = collection(db, 'products');
        const productSnapshot = await getDocs(productsCollection);
        const fetchedProducts = productSnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id,
                 ...data,
                 createdAt: data.createdAt?.toDate()?.toISOString() || null,
                 boostedUntil: data.boostedUntil || null
            } as Product;
        });
        return fetchedProducts;
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}

export async function fetchProductById(id: string): Promise<Product | null> {
    try {
        const productDocRef = doc(db, 'products', id);
        const productDoc = await getDoc(productDocRef);
        if (productDoc.exists()) {
            const data = productDoc.data();
            return { 
                id: productDoc.id,
                ...data,
                createdAt: data.createdAt?.toDate()?.toISOString() || null,
                boostedUntil: data.boostedUntil || null
             } as Product;
        }
        return null;
    } catch (error) {
        console.error("Error fetching product by ID:", error);
        return null;
    }
}

export async function fetchProductsByVendorId(vendorId: string): Promise<Product[]> {
    try {
        const q = query(collection(db, "products"), where("vendorId", "==", vendorId));
        const querySnapshot = await getDocs(q);
        const fetchedProducts = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                 id: doc.id,
                 ...data,
                 createdAt: data.createdAt?.toDate()?.toISOString() || null,
                 boostedUntil: data.boostedUntil || null
            } as Product;
        });
        return fetchedProducts;
    } catch (error) {
        console.error("Error fetching products by vendor ID:", error);
        return [];
    }
}


export async function fetchReviewsByProductId(productId: string): Promise<Review[]> {
    try {
        // Assuming reviews are a subcollection of products
        const reviewsCollection = collection(db, 'products', productId, 'reviews');
        const reviewSnapshot = await getDocs(reviewsCollection);
        const reviews: Review[] = [];

        for(const doc of reviewSnapshot.docs) {
            const reviewData = { id: doc.id, ...doc.data() } as Review;
            const repliesCollection = collection(db, 'products', productId, 'reviews', doc.id, 'replies');
            const repliesSnapshot = await getDocs(query(repliesCollection));
            reviewData.replies = repliesSnapshot.docs.map(replyDoc => ({ id: replyDoc.id, ...replyDoc.data() } as Reply));
            reviews.push(reviewData);
        }

        return reviews;
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
}


export async function fetchPendingApplications(): Promise<VendorApplication[]> {
    try {
        const q = query(collection(db, "vendorApplications"), where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VendorApplication[];
    } catch (error) {
        console.error("Error fetching pending applications:", error);
        return [];
    }
}

export async function fetchPendingLawyerApplications(): Promise<LawyerApplication[]> {
    try {
        const q = query(collection(db, "lawyerApplications"), where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LawyerApplication[];
    } catch (error) {
        console.error("Error fetching pending lawyer applications:", error);
        return [];
    }
}

export async function fetchPendingLogisticsApplications(): Promise<LogisticsApplication[]> {
    try {
        const q = query(collection(db, "logisticsApplications"), where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LogisticsApplication[];
    } catch (error) {
        console.error("Error fetching pending logistics applications:", error);
        return [];
    }
}


export async function fetchPendingCurrencyExchangeApplications(): Promise<CurrencyExchangeApplication[]> {
    try {
        const q = query(collection(db, "currencyExchangeApplications"), where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CurrencyExchangeApplication[];
    } catch (error) {
        console.error("Error fetching pending currency exchange applications:", error);
        return [];
    }
}

export async function fetchPendingServiceApplications(): Promise<ServiceProviderApplication[]> {
    try {
        const q = query(collection(db, "serviceProviderApplications"), where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ServiceProviderApplication[];
    } catch (error) {
        console.error("Error fetching pending service provider applications:", error);
        return [];
    }
}


export async function fetchVendorApplicationByUid(uid: string): Promise<VendorApplication | null> {
    try {
        const q = query(collection(db, "vendorApplications"), where("uid", "==", uid), where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const appDoc = querySnapshot.docs[0];
            return { id: appDoc.id, ...appDoc.data() } as VendorApplication;
        }
        return null;
    } catch (error) {
        console.error("Error fetching vendor application by UID:", error);
        return null;
    }
}

export async function fetchOrdersByUserId(userId: string): Promise<Order[]> {
    try {
        const q = query(collection(db, "orders"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
}

export async function createTransaction(vendorId: string, description: string, amount: number, providerType: string) {
    try {
        await addDoc(collection(db, "transactions"), {
            vendorId,
            description,
            amount,
            status: 'successful',
            timestamp: serverTimestamp(),
            providerType,
        });
    } catch (error) {
        console.error("Error creating transaction:", error);
        // Optionally re-throw or handle it silently
    }
}

export async function fetchTransactionsByVendorId(vendorId: string): Promise<Transaction[]> {
    try {
        const q = query(collection(db, 'transactions'), where('vendorId', '==', vendorId));
        const querySnapshot = await getDocs(q);
        const transactions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
        // Sort on the client-side to avoid composite index
        return transactions.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
    } catch (error) {
        console.error("Error fetching transactions by vendor ID:", error);
        return [];
    }
}

export type ProviderType = 'vendor' | 'lawyer' | 'logistics' | 'currency-exchange' | 'service' | null;

export async function getUserProviderRole(uid: string): Promise<{ type: ProviderType, id: string | null }> {
    const collections: { [key: string]: ProviderType } = {
        'vendors': 'vendor',
        'lawyers': 'lawyer',
        'logisticsCompanies': 'logistics',
        'currencyExchangeAgents': 'currency-exchange',
        'serviceProviders': 'service'
    };

    for (const collectionName in collections) {
        const q = query(collection(db, collectionName), where("uid", "==", uid), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return { type: collections[collectionName], id: snapshot.docs[0].id };
        }
    }

    return { type: null, id: null };
}

export async function checkIfUserIsAlreadyProvider(uid: string): Promise<boolean> {
  const { type } = await getUserProviderRole(uid);
  if (type) return true;

  // Also check pending applications
  const applicationCollections = [
    'vendorApplications', 'lawyerApplications', 'logisticsApplications', 
    'currencyExchangeApplications', 'serviceProviderApplications'
  ];

  for (const collectionName of applicationCollections) {
    const q = query(collection(db, collectionName), where("uid", "==", uid), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return true; // Found a pending application
    }
  }

  return false;
}

export async function fetchProviderDataByUid(uid: string): Promise<{ providerData: any | null, type: string | null }> {
    const providerCollections = {
        'serviceProviders': 'service', 
        'lawyers': 'lawyer', 
        'logisticsCompanies': 'logistics', 
        'currencyExchangeAgents': 'currency-exchange',
        'vendors': 'vendor'
    };
    for (const [collectionName, type] of Object.entries(providerCollections)) {
        const q = query(collection(db, collectionName), where("uid", "==", uid), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { providerData: { id: doc.id, ...doc.data() }, type };
        }
    }
    return { providerData: null, type: null };
}

export async function fetchNotifications(uid: string): Promise<Notification[]> {
    const q = query(
        collection(db, "notifications"),
        where("recipientId", "==", uid)
    );
    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
    // Sort on the client side
    return notifications.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
}

export async function markAllNotificationsAsRead(uid: string): Promise<void> {
    const q = query(
        collection(db, "notifications"),
        where("recipientId", "==", uid),
        where("isRead", "==", false)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
    });
    await batch.commit();
}


/**
 * Checks if a given value for a field already exists in a collection.
 * @param collections - An array of collection names to check in.
 * @param fieldName - The name of the field to check.
 * @param value - The value to check for.
 * @returns {Promise<boolean>} - True if the value exists, false otherwise.
 */
export async function checkIfValueExists(collections: string[], fieldName: string, value: string): Promise<boolean> {
    if (!value) return false; // Don't check for empty strings

    for (const collectionName of collections) {
        const q = query(collection(db, collectionName), where(fieldName, "==", value), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return true; // Value exists
        }
    }
    return false; // Value does not exist in any of the collections
}


// --- Static Data (can be kept or moved) ---
export const productCategories = [
    { id: 'computers', name: 'Computers' },
    { id: 'mobile-phones', name: 'Mobile Phones' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'fashion', name: 'Fashion' },
    { id: 'accessories', name: 'Accessories' },
    { id: 'gaming', name: 'Gaming' },
    { id: 'home-goods', name: 'Home Goods' },
    { id: 'furniture', name: 'Furniture' },
    { id: 'kitchenware', name: 'Kitchenware' },
    { id: 'groceries', name: 'Groceries' },
    { id: 'automobile', name: 'Automobile' },
    { id: 'property', name: 'Property' },
    { id: 'precious-metals-minerals', name: 'Precious Metals & Minerals' },
    { id: 'internet-providers', name: 'Internet Providers' },
    { id: 'cosmetics', name: 'Cosmetics' },
    { id: 'agriculture', name: 'Agriculture' },
    { id: 'logistics', name: 'Logistics' },
    { id: 'services', name: 'Services' },
    { id: 'find-a-lawyer', name: 'Find a Lawyer' },
    { id: 'currency-exchange', name: 'Currency Exchange' },
];

export const logisticsCategories = [
  { id: 'international-flight', name: 'International Flight' },
  { id: 'local-flight', name: 'Local Flight' },
  { id: 'train-logistics', name: 'Train Logistics' },
  { id: 'car-logistics', name: 'Car Logistics' },
  { id: 'dispatch-rider', name: 'Dispatch Rider' },
];

export const practiceAreas = [
  "Corporate Law", "Commercial Law", "Real Estate Law", "Intellectual Property",
  "Family Law", "Criminal Law", "Tax Law", "Litigation", "Arbitration",
  "Maritime Law", "Aviation Law", "Oil & Gas Law", "Immigration Law",
  "Employment Law", "Banking & Finance"
];

export const transactionTypes = [
    "Cash", "Bank Transfer", "Mobile Money", "Card Payment"
];

export const serviceSubCategories: Record<string, string[]> = {
  "Professional Services": [
    "Architect", "Interior Designer", "Builder", "Surveyor", "Mobile App Developer",
    "Engineer", "Web App Developer", "UI/UX", "Cyber Security Services", "Data Engineer",
    "Data Analyst", "Consultant", "Security", "Contractor", "Personal Doctor"
  ],
  "Digital Services": [
    "Website Development",
    "Mobile App Development",
    "Graphic Design",
    "Content Writing",
    "Social Media Management",
    "SEO Services",
    "Data Entry",
    "Virtual Assistance"
  ],
  "Creative & Media Services": [
    "Photography",
    "Videography",
    "Logo & Branding",
    "Animation & Motion Graphics",
    "Voice Over",
    "Music Production"
  ],
  "Home & Repair Services": [
    "Plumbing",
    "Electrical Repairs",
    "Cleaning Services",
    "Painting",
    "AC Repair & Installation",
    "Furniture Assembly",
    "Installation"
  ],
  "Education & Training": [
    "Online Courses",
    "Home Tutoring",
    "Exam Prep",
    "Skill Training",
    "Language Lessons",
    "IT Bootcamps"
  ],
  "Beauty & Personal Care": [
    "Hairdressing",
    "Makeup Services",
    "Nail Care",
    "Spa & Massage",
    "Skincare Treatments"
  ],
  "Automobile Services": [
    "Car Washing",
    "Car Repair & Maintenance",
    "Vehicle Inspection",
    "Car Towing",
    "Car Painting"
  ],
  "Security Services": [
    "CCTV Installation",
    "Guard Hiring",
    "Alarm System Setup",
    "Cybersecurity Services"
  ],
  "Event & Travel Services": [
    "Event Planning",
    "Catering",
    "Travel Booking",
    "Hotel Reservation",
    "DJ & MC Services",
    "Decor & Rentals"
  ]
};

export const serviceCategories = Object.keys(serviceSubCategories).map(name => ({
  id: name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-'),
  name: name,
}));

export const nigerianStates = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe",
    "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
    "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
    "Taraba", "Yobe", "Zamfara"
];
