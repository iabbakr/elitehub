

'use server';

import { revalidatePath } from 'next/cache';
import { getAdminDb, FieldValue } from '@/lib/firebase-admin';
import type { UserData } from '@/lib/data';
import { collection, query, where, getDocs, doc, writeBatch, updateDoc, limit } from 'firebase/firestore';


/**
 * Approves a provider application using the Firebase Admin SDK.
 * This function bypasses security rules to perform privileged operations.
 * @param data - Contains `appId` and `appType`.
 */
export async function approveApplicationAction(data: { appId: string, appType: 'vendor' | 'lawyer' | 'logistics' | 'service' | 'currency-exchange' }) {
    const { appId, appType } = data;
    if (!appId || !appType) {
        throw new Error("Application ID and type are required.");
    }

    const adminDb = getAdminDb();
    const collectionMap = {
        vendor: { app: 'vendorApplications', main: 'vendors' },
        lawyer: { app: 'lawyerApplications', main: 'lawyers' },
        logistics: { app: 'logisticsApplications', main: 'logisticsCompanies' },
        service: { app: 'serviceProviderApplications', main: 'serviceProviders' },
        'currency-exchange': { app: 'currencyExchangeApplications', main: 'currencyExchangeAgents' }
    };

    const { app: appCollectionName, main: targetCollectionName } = collectionMap[appType];
    const appRef = adminDb.collection(appCollectionName).doc(appId);

    try {
        await adminDb.runTransaction(async (transaction) => {
            const appDoc = await transaction.get(appRef);
            if (!appDoc.exists) {
                throw new Error("Application not found.");
            }
            const appData = appDoc.data();
            if (!appData) {
                 throw new Error("Application data is missing.");
            }
            if (appData.status === 'approved') {
                 throw new Error("Application has already been approved.");
            }
            const newUserUid = appData.uid;

            // --- Referral Logic ---
            // On approval, we move the user from 'pending' to 'successful' for the referrer
            const userRef = adminDb.collection('users').doc(newUserUid);
            const userDoc = await transaction.get(userRef);
            const userData = userDoc.data() as UserData;

            if (userDoc.exists && userData?.referredBy) {
                const referredByCode = userData.referredBy;
                
                // Find the referrer by their referral code
                const referrerQuery = adminDb.collection("users").where("referralCode", "==", referredByCode).limit(1);
                const referrerSnapshot = await transaction.get(referrerQuery);
                
                if (!referrerSnapshot.empty) {
                    const referrerDoc = referrerSnapshot.docs[0];
                    const pendingReferralEntry = (referrerDoc.data().pendingReferrals || []).find((ref: any) => ref.uid === newUserUid);
                    
                    if (pendingReferralEntry) {
                         // Move from pending to successful
                        transaction.update(referrerDoc.ref, {
                            pendingReferrals: FieldValue.arrayRemove(pendingReferralEntry),
                            successfulReferrals: FieldValue.arrayUnion(pendingReferralEntry)
                        });
                    }
                }
            }
            // --- End Referral Logic ---

            const { password, confirmPassword, terms, ...providerBaseData } = appData;

            const newProviderRef = adminDb.collection(targetCollectionName).doc();
            
            const newProviderData = {
                ...providerBaseData,
                status: 'active',
                rating: 0,
                ratingCount: 0,
                totalRating: 0,
                profileVisibleUntil: null,
                isVerified: false,
                badgeExpirationDate: null,
                tier: null,
                kycStatus: 'none',
                boostedUntil: null,
                profileUpdateStatus: 'none',
                memberSince: new Date().toISOString().split('T')[0],
                profileImage: 'https://res.cloudinary.com/dzh1040s2/image/upload/v1721832966/user_fck81m.png',
                ...(appType === 'vendor' && { postLimit: 0, postCount: 0 }),
                notifiedViewMilestones: [],
            };

            // 1. Create the new provider document
            transaction.set(newProviderRef, newProviderData);
            
            // 2. Update the original application's status to 'approved'
            transaction.update(appRef, { status: 'approved' });

            // 3. Create a notification for the user
            const notificationRef = adminDb.collection('notifications').doc();
            transaction.set(notificationRef, {
                recipientId: providerBaseData.uid,
                senderId: 'admin',
                senderName: 'EliteHub Team',
                type: 'application_approved',
                text: `Congratulations! Your application to become a ${appType} has been approved. You can now manage your profile.`,
                isRead: false,
                timestamp: FieldValue.serverTimestamp()
            });
        });
        
        console.log(`Application ${appId} of type ${appType} approved successfully.`);
        revalidatePath('/admin');

    } catch (error: any) {
        console.error(`Error approving application ${appId}:`, error);
        throw new Error(error.message || "An unknown error occurred during approval.");
    }
}


const generateReferralCode = (name: string) => {
    const namePart = name.split(' ')[0].slice(0, 4).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${namePart}${randomPart}`;
};


/**
 * Securely handles new user creation and referral tracking on the server.
 * This is called from the client-side signup form after Firebase Auth user is created.
 * @param data - An object containing the new user's UID, full name, email, and the referral code they used.
 */
export async function handleReferralOnSignup(data: { newUserUid: string; newUserFullName: string; newUserEmail: string; referralCode: string | null | undefined }): Promise<void> {
    const { newUserUid, newUserFullName, newUserEmail, referralCode } = data;

    if (!newUserUid) {
        throw new Error("New user UID is required.");
    }

    const adminDb = getAdminDb();
    
    // Create the new user's document
    const newUserRef = adminDb.collection('users').doc(newUserUid);
    
    const newUserData: Omit<UserData, 'id'> = {
      uid: newUserUid,
      fullName: newUserFullName,
      email: newUserEmail,
      referralCode: generateReferralCode(newUserFullName),
      referralBalance: 0,
      pendingReferrals: [],
      successfulReferrals: [],
      hasSubscribed: false,
      referredBy: referralCode || null,
      createdAt: FieldValue.serverTimestamp(),
      lastLogin: FieldValue.serverTimestamp(),
    };
    
    await newUserRef.set(newUserData);

    // If no referral code was used, we're done.
    if (!referralCode) {
        console.log(`User ${newUserFullName} created without a referral code.`);
        return;
    }

    try {
        await adminDb.runTransaction(async (transaction) => {
            const referrerQuery = adminDb.collection("users").where("referralCode", "==", referralCode).limit(1);
            const referrerSnapshot = await transaction.get(referrerQuery);
    
            if (!referrerSnapshot.empty) {
                const referrerDoc = referrerSnapshot.docs[0];
                const referrerUid = referrerDoc.id;
                
                if (referrerUid === newUserUid) {
                    console.warn("User attempted to refer themselves.");
                    return;
                }
                
                const newReferralEntry = { uid: newUserUid, fullName: newUserFullName };
    
                transaction.update(referrerDoc.ref, {
                    pendingReferrals: FieldValue.arrayUnion(newReferralEntry)
                });
    
                console.log(`Successfully added ${newUserFullName} to pending referrals for ${referrerDoc.data().fullName}.`);
            } else {
                console.warn(`Referral code ${referralCode} does not exist.`);
            }
        });
    } catch (error) {
        console.error("Error in handleReferralOnSignup server action:", error);
        // We don't re-throw the error to the client to avoid blocking the signup flow
    }
}


export async function handlePayoutDecision(requestId: string, decision: 'paid' | 'rejected', rejectionReason?: string) {
    const adminDb = getAdminDb();
    const requestRef = adminDb.collection('payoutRequests').doc(requestId);

    const requestDoc = await requestRef.get();
    if (!requestDoc.exists) {
        throw new Error("Payout request not found.");
    }
    const requestData = requestDoc.data()!;

    if (decision === 'paid') {
        await requestRef.update({ status: 'paid', paidAt: FieldValue.serverTimestamp() });
        await createNotificationForUser(requestData.userId, `Your payout request of ₦${requestData.amount.toLocaleString()} has been approved and paid.`, 'referral_bonus');
    } else {
        const userRef = adminDb.collection('users').doc(requestData.userId);
        
        await adminDb.runTransaction(async (transaction) => {
            // Refund the user's balance
            transaction.update(userRef, { referralBalance: FieldValue.increment(requestData.amount) });
            // Mark the request as rejected
            transaction.update(requestRef, { status: 'rejected', rejectionReason });
        });
        
        await createNotificationForUser(requestData.userId, `Your payout request was rejected. Reason: ${rejectionReason || 'No reason provided.'} The amount has been returned to your balance.`, 'referral_bonus');
    }

    revalidatePath('/admin/payouts');
}

async function createNotificationForUser(userId: string, text: string, type: 'referral_bonus' | string) {
    const adminDb = getAdminDb();
    await adminDb.collection('notifications').add({
        recipientId: userId,
        senderId: 'admin',
        senderName: 'EliteHub Payouts',
        type: type,
        text: text,
        isRead: false,
        timestamp: FieldValue.serverTimestamp(),
    });
}
