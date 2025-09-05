

import { collection, getDocs, doc, getDoc, query, where, addDoc, serverTimestamp, orderBy, increment, limit, writeBatch, Timestamp, arrayUnion, runTransaction } from "firebase/firestore";
import { db } from "./firebase";
import { auth } from "./firebase";
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";

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
  profileVisibleUntil: string | null;
  profileUpdateStatus?: 'pending' | 'approved' | 'rejected' | 'none';
  lastProfileUpdateRequest?: any;
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
    profileUpdateStatus?: 'pending' | 'approved' | 'rejected' | 'none';
    lastProfileUpdateRequest?: any;
    boostedUntil?: string;
};

export type LawyerApplication = Omit<Lawyer, 'id' | 'rating' | 'ratingCount' | 'totalRating' | 'profileVisibleUntil' | 'isVerified' | 'badgeExpirationDate' | 'tier' | 'kycStatus' | 'boostedUntil'> & {
    id: string;
    submittedAt: any;
    idCardFront?: string;
    idCardBack?: string;
    passportPhoto?: string;
    nin?: string;
    password?: string;
    referralCode?: string;
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
    profileUpdateStatus?: 'pending' | 'approved' | 'rejected' | 'none';
    lastProfileUpdateRequest?: any;
};

export type CurrencyExchangeApplication = Omit<CurrencyExchangeAgent, 'id' | 'rating' | 'ratingCount' | 'totalRating' | 'profileVisibleUntil' | 'galleryActiveUntil' | 'isVerified' | 'badgeExpirationDate' | 'tier' | 'kycStatus'> & {
    id: string;
    submittedAt: any;
    idCardFront?: string;
    idCardBack?: string;
    passportPhoto?: string;
    nin?: string;
    password?: string;
    referralCode?: string;
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
    profileUpdateStatus?: 'pending' | 'approved' | 'rejected' | 'none';
    lastProfileUpdateRequest?: any;
};

export type LogisticsApplication = Omit<LogisticsCompany, 'id' | 'rating' | 'ratingCount' | 'totalRating' | 'profileVisibleUntil' | 'galleryActiveUntil' | 'isVerified' | 'badgeExpirationDate' | 'tier' | 'boostedUntil' | 'kycStatus'> & {
    id: string;
    submittedAt: any;
    idCardFront?: string;
    idCardBack?: string;
    passportPhoto?: string;
    nin?: string;
    password?: string;
    referralCode?: string;
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
    profileUpdateStatus?: 'pending' | 'approved' | 'rejected' | 'none';
    lastProfileUpdateRequest?: any;
};

export type ServiceProviderApplication = Omit<ServiceProvider, 'id' | 'rating' | 'ratingCount' | 'totalRating' | 'profileVisibleUntil' | 'galleryActiveUntil' | 'isVerified' | 'badgeExpirationDate' | 'tier' | 'boostedUntil' | 'kycStatus'> & {
    id: string;
    submittedAt: any;
    idCardFront?: string;
    idCardBack?: string;
    passportPhoto?: string;
    nin?: string;
    password?: string;
    referralCode?: string;
};


export type UserData = {
    id: string;
    uid: string;
    fullName: string;
    email: string;
    createdAt: any;
    lastLogin?: any;
    referralCode?: string;
    referredBy: string | null;
    referralBalance: number;
    pendingReferrals: { uid: string; fullName: string }[];
    successfulReferrals: { uid: string; fullName: string }[];
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    hasSubscribed: boolean; // New field to track if user has ever subscribed
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
  password?: string;
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
  uid: string | null;
  submittedAt: any;
  address: string;
  categories: string[];
  referralCode?: string;
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
  uid: string; // The auth UID of the provider
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
    type: 'review' | 'reply' | 'application_approved' | 'kyc_approved' | 'kyc_rejected' | 'product_uploaded' | 'product_status_changed' | 'product_deleted' | 'product_boosted' | 'profile_view_milestone' | 'payout_request' | 'referral_bonus' | 'profile_update_request' | 'profile_update_approved' | 'profile_update_rejected';
    productId?: string;
    productName?: string;
    text: string;
    isRead: boolean;
    timestamp: any;
    amount?: number;
}

export type FilterState = {
  location: string;
  category: string;
  vendor: string;
  brand: string;
  product: string;
};

export type ProfileUpdateRequest = {
  id: string;
  providerId: string;
  uid: string;
  providerType: ProviderType;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: any;
  data: any; // The new profile data
};

export async function createNotification(notification: Omit<Notification, 'id'>) {
    try {
        await addDoc(collection(db, 'notifications'), notification);
    } catch (error) {
        console.error("Error creating notification:", error);
    }
}

// Helper function to convert Firestore Timestamps to strings
const serializeTimestamps = (data: any) => {
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        } else if (typeof data[key] === 'object' && data[key] !== null) {
            serializeTimestamps(data[key]); // Recurse for nested objects
        }
    }
    return data;
};


// --- Firestore Data Fetching Functions ---
export async function fetchUsers(): Promise<UserData[]> {
  try {
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    return userSnapshot.docs.map(doc => serializeTimestamps({ id: doc.id, ...doc.data() }) as UserData);
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function fetchUsersByUids(uids: string[]): Promise<UserData[]> {
  if (!uids || uids.length === 0) return [];
  try {
    const users: UserData[] = [];
    // Firestore 'in' query is limited to 30 elements. We need to batch the requests.
    for (let i = 0; i < uids.length; i += 30) {
      const batchUids = uids.slice(i, i + 30);
      const q = query(collection(db, 'users'), where('uid', 'in', batchUids));
      const snapshot = await getDocs(q);
      const batchUsers = snapshot.docs.map(doc => serializeTimestamps({ id: doc.id, ...doc.data() }) as UserData);
      users.push(...batchUsers);
    }
    return users;
  } catch (error) {
    console.error("Error fetching users by UIDs:", error);
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
      return serializeTimestamps({ id: docSnap.id, ...docSnap.data() }) as ServiceProvider;
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
      return serializeTimestamps({ id: docSnap.id, ...docSnap.data() }) as LogisticsCompany;
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
      return serializeTimestamps({ id: agentDoc.id, ...agentDoc.data() }) as CurrencyExchangeAgent;
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
      return serializeTimestamps({ id: lawyerDoc.id, ...lawyerDoc.data() }) as Lawyer;
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
    return vendorSnapshot.docs.map(doc => serializeTimestamps({ id: doc.id, ...doc.data() }) as Vendor);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
}

export async function fetchVendorById(id: string): Promise<Vendor | null> {
  try {
    const vendorDocRef = doc(db, 'vendors', id);
    const vendorDoc = await getDoc(vendorDocRef);
    if (vendorDoc.exists()) {
      return serializeTimestamps({ id: vendorDoc.id, ...vendorDoc.data() }) as Vendor;
    }
    
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
        const q = query(collection(db, "vendors"), where("uid", "==", uid), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const vendorDoc = querySnapshot.docs[0];
            return serializeTimestamps({ id: vendorDoc.id, ...vendorDoc.data() }) as Vendor;
        }
        return null;
    } catch (error) {
        console.error("Error fetching vendor by UID:", error);
        return null;
    }
}

export async function fetchUserByUid(uid: string): Promise<UserData | null> {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return serializeTimestamps({ id: userSnap.id, ...userSnap.data() }) as UserData;
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
            const repliesQuery = query(repliesCollection);
            const repliesSnapshot = await getDocs(repliesQuery);
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

export async function createTransaction(vendorId: string, uid: string, description: string, amount: number, providerType: string) {
    try {
        await addDoc(collection(db, "transactions"), {
            vendorId,
            uid,
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


export async function fetchTransactionsByVendorId(vendorId: string, uid: string): Promise<Transaction[]> {
    try {
        const q = query(
            collection(db, 'transactions'), 
            where('vendorId', '==', vendorId),
            where('uid', '==', uid), 
            orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const transactions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
        return transactions;
    } catch (error) {
        console.error("Error fetching transactions by vendor ID:", error);
        return [];
    }
}

export type ProviderType = 'vendor' | 'lawyer' | 'logistics' | 'currency-exchange' | 'service' | null;

export async function getUserProviderRole(uid: string): Promise<{ type: ProviderType, id: string | null }> {
    const collections: Record<string, ProviderType> = {
        'vendors': 'vendor',
        'lawyers': 'lawyer',
        'logisticsCompanies': 'logistics',
        'currencyExchangeAgents': 'currency-exchange',
        'serviceProviders': 'service'
    };

    for (const collectionName in collections) {
        const q = query(collection(db, collectionName), where("uid", "==", uid), limit(1));
        try {
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                return { type: collections[collectionName], id: snapshot.docs[0].id };
            }
        } catch (error) {
            // This can happen if rules deny the query, which is fine. We just continue.
            // console.warn(`Could not query ${collectionName} for UID ${uid}. It might be a permissions issue, which is expected for non-admins.`);
        }
    }

    return { type: null, id: null };
}

export async function checkIfUserHasPendingApplication(uid: string): Promise<string | null> {
    const applicationCollections = {
        'vendorApplications': 'Vendor',
        'lawyerApplications': 'Lawyer',
        'logisticsApplications': 'Logistics Partner',
        'currencyExchangeApplications': 'Currency Exchange Agent',
        'serviceProviderApplications': 'Service Provider',
    };

    for (const [collectionName, type] of Object.entries(applicationCollections)) {
        try {
            const q = query(collection(db, collectionName), where("uid", "==", uid), where("status", "==", "pending"), limit(1));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                return type; // Return the user-friendly type name
            }
        } catch (error) {
             // console.warn(`Could not query ${collectionName} for pending applications for UID ${uid}. It might be a permissions issue, which is expected for non-admins.`);
        }
    }

    return null;
}

export async function fetchProviderDataByUid(uid: string): Promise<{ providerData: any | null, type: string | null, transactions: Transaction[] }> {
    const { type, id } = await getUserProviderRole(uid);

    if (type && id) {
        const collectionNameMapping: Record<string, string> = {
            'vendor': 'vendors',
            'lawyer': 'lawyers',
            'logistics': 'logisticsCompanies',
            'currency-exchange': 'currencyExchangeAgents',
            'service': 'serviceProviders'
        };
        
        const collectionName = collectionNameMapping[type];
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const providerData = { id: docSnap.id, ...docSnap.data() };
            const transactions = await fetchTransactionsByVendorId(id, uid);
            return { providerData, type, transactions };
        }
    }

    return { providerData: null, type: null, transactions: [] };
}


export async function fetchNotifications(uid: string): Promise<Notification[]> {
    const q = query(
        collection(db, "notifications"),
        where("recipientId", "==", uid),
        orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
    return notifications;
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
 * Checks if a given email is already in use by an existing user account.
 * @param email The email to check.
 * @returns True if the email is in use, false otherwise.
 */
export async function checkIfEmailExists(email: string): Promise<boolean> {
  if (!email) return false;
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0;
  } catch (error) {
    console.error("Error checking if email exists:", error);
    // In case of an error, assume it doesn't exist to allow signup attempt,
    // which will then fail with a more specific auth error if needed.
    return false;
  }
}


export type PayoutRequest = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: 'pending' | 'paid' | 'rejected';
  requestedAt: any;
  paidAt?: any;
  rejectionReason?: string;
};


export async function createPayoutRequest(requestData: Omit<PayoutRequest, 'id' | 'status' | 'requestedAt'>) {
    const userRef = doc(db, 'users', requestData.userId);
    const payoutRequestRef = doc(collection(db, 'payoutRequests'));

    await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
            throw "User does not exist!";
        }
        
        // Deduct balance from user
        transaction.update(userRef, { referralBalance: 0 });
        
        // Create payout request
        transaction.set(payoutRequestRef, {
             ...requestData,
            status: 'pending',
            requestedAt: serverTimestamp(),
        });
    });

    // Also notify the admin
    await createNotification({
        recipientId: 'WSrXKwyNEAb4Ib7fBM85OP9S63G3', // Admin UID
        senderId: requestData.userId,
        senderName: requestData.userName,
        type: 'payout_request',
        text: `${requestData.userName} has requested a payout of ₦${requestData.amount.toLocaleString()}.`,
        isRead: false,
        timestamp: serverTimestamp(),
        amount: requestData.amount,
    });
}
    
export async function fetchPendingProfileUpdates(): Promise<ProfileUpdateRequest[]> {
  const collections = [
    'vendorProfileUpdateRequests',
    'lawyerProfileUpdateRequests',
    'logisticsProfileUpdateRequests',
    'currencyExchangeProfileUpdateRequests',
    'serviceProfileUpdateRequests'
  ];
  const allRequests: ProfileUpdateRequest[] = [];

  for (const collectionName of collections) {
    try {
      const q = query(collection(db, collectionName), where("status", "==", "pending"));
      const snapshot = await getDocs(q);
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProfileUpdateRequest));
      allRequests.push(...requests);
    } catch (error) {
      console.error(`Error fetching from ${collectionName}:`, error);
    }
  }

  return allRequests.sort((a, b) => (b.requestedAt?.seconds || 0) - (a.requestedAt?.seconds || 0));
}


export async function createProfileUpdateRequest(providerType: ProviderType, providerId: string, uid: string, data: any) {
  if (!providerType) throw new Error("Invalid provider type for update request.");
  
  const collectionNameMapping: Record<string, string> = {
    'vendor': 'vendorProfileUpdateRequests',
    'lawyer': 'lawyerProfileUpdateRequests',
    'logistics': 'logisticsProfileUpdateRequests',
    'currency-exchange': 'currencyExchangeProfileUpdateRequests',
    'service': 'serviceProfileUpdateRequests'
  };
  
  const mainCollectionMapping: Record<string, string> = {
      'vendor': 'vendors',
      'lawyer': 'lawyers',
      'logistics': 'logisticsCompanies',
      'currency-exchange': 'currencyExchangeAgents',
      'service': 'serviceProviders'
  };

  const requestCollectionName = collectionNameMapping[providerType];
  const mainCollectionName = mainCollectionMapping[providerType];

  const batch = writeBatch(db);

  // 1. Create the update request document
  const requestRef = doc(collection(db, requestCollectionName));
  batch.set(requestRef, {
    providerId,
    uid,
    providerType,
    status: 'pending',
    requestedAt: serverTimestamp(),
    data
  });

  // 2. Update the main provider document
  const providerRef = doc(db, mainCollectionName, providerId);
  batch.update(providerRef, {
    profileUpdateStatus: 'pending',
    lastProfileUpdateRequest: serverTimestamp()
  });

  await batch.commit();

  // 3. Notify admin (optional, but good practice)
  await createNotification({
    recipientId: 'WSrXKwyNEAb4Ib7fBM85OP9S63G3', // Special admin ID
    senderId: uid,
    senderName: data.name || data.fullName || data.businessName,
    type: 'profile_update_request',
    text: `A profile update request has been submitted by ${data.name || data.fullName || data.businessName}.`,
    isRead: false,
    timestamp: serverTimestamp(),
  });
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
