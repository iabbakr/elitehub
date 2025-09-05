

'use server';

import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  addDoc,
  serverTimestamp,
  orderBy,
  increment,
  limit,
  writeBatch,
  Timestamp,
  arrayUnion,
  runTransaction,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { UserData, createNotification } from "./data";
import { getAdminDb, FieldValue } from './firebase-admin';


/**
 * Server-side function to process a successful subscription and apply referral bonuses.
 * This runs with admin privileges to safely update multiple user documents.
 * @param subscribingUserUid - The UID of the user who just subscribed.
 */
export async function handleSuccessfulSubscriptionReferral(subscribingUserUid: string) {
    const adminDb = getAdminDb();
    
    await adminDb.runTransaction(async (transaction) => {
        const subscribingUserRef = adminDb.collection("users").doc(subscribingUserUid);
        const subscribingUserSnap = await transaction.get(subscribingUserRef);

        if (!subscribingUserSnap.exists) {
            console.warn(`Subscribing user ${subscribingUserUid} not found.`);
            return;
        }
        
        const subscribingUserData = subscribingUserSnap.data() as UserData;
        const referredByCode = subscribingUserData.referredBy;
        
        // Ensure bonus is only applied once and the user was actually referred
        if (subscribingUserData.hasSubscribed || !referredByCode) {
            // Mark as subscribed even if no referrer, to prevent future checks
            transaction.update(subscribingUserRef, { hasSubscribed: true });
            return;
        }

        // Find the referrer by their unique code
        const q = adminDb.collection("users").where("referralCode", "==", referredByCode).limit(1);
        const referrerSnapshot = await transaction.get(q);
        
        if (referrerSnapshot.empty) {
            console.warn(`Referrer with code ${referredByCode} not found.`);
            // Still mark the user as subscribed
            transaction.update(subscribingUserRef, { hasSubscribed: true });
            return;
        }
        
        const referrerDoc = referrerSnapshot.docs[0];
        const referrerUid = referrerDoc.id;
        const referrerData = referrerDoc.data() as UserData;

        // Find the pending referral entry to move it
        const pendingReferralEntry = (referrerData.pendingReferrals || []).find(ref => ref.uid === subscribingUserUid);

        // 1. Credit referrer and move user from pending to successful
        if (pendingReferralEntry) {
            transaction.update(referrerDoc.ref, { 
                referralBalance: FieldValue.increment(1000),
                pendingReferrals: FieldValue.arrayRemove(pendingReferralEntry),
                successfulReferrals: FieldValue.arrayUnion(pendingReferralEntry)
            });
        } else {
             // Fallback if not found in pending, just add to successful
             const successfulReferralEntry = { uid: subscribingUserUid, fullName: subscribingUserData.fullName };
             transaction.update(referrerDoc.ref, { 
                referralBalance: FieldValue.increment(1000),
                successfulReferrals: FieldValue.arrayUnion(successfulReferralEntry)
            });
        }


        // 2. Credit referee (the new subscriber)
        transaction.update(subscribingUserRef, { 
            referralBalance: FieldValue.increment(1000),
            hasSubscribed: true // Mark as subscribed to prevent future bonus triggers
        });

        const notificationsCollection = adminDb.collection('notifications');
        
        // 3. Create notification for referrer
        const referrerNotificationRef = adminDb.collection('notifications').doc();
        transaction.set(referrerNotificationRef, {
            recipientId: referrerUid,
            senderId: subscribingUserUid,
            senderName: subscribingUserData.fullName,
            type: 'referral_bonus',
            text: `Your referral, ${subscribingUserData.fullName}, just subscribed! You've both earned ₦1,000.`,
            isRead: false,
            timestamp: FieldValue.serverTimestamp(),
            amount: 1000,
        });

        // 4. Create notification for referee
        const refereeNotificationRef = adminDb.collection('notifications').doc();
        transaction.set(refereeNotificationRef, {
            recipientId: subscribingUserUid,
            senderId: 'system',
            senderName: 'EliteHub Referrals',
            type: 'referral_bonus',
            text: `Welcome aboard! As a thank you for using a referral code, you've earned ₦1,000.`,
            isRead: false,
            timestamp: FieldValue.serverTimestamp(),
            amount: 1000,
        });
        
        console.log(`Referral bonus of ₦1000 credited to ${referrerData.fullName} and ${subscribingUserData.fullName}.`);
    });
}
