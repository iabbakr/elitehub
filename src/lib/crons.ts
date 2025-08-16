
'use server';

import { collection, getDocs, query, where, writeBatch, Timestamp, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Finds and deletes vendor accounts that have been inactive for more than 3 months.
 * Inactivity is determined by the `lastLogin` timestamp on their user document.
 * It also deletes all products associated with the deleted vendors.
 * @returns {Promise<{deletedCount: number, errorCount: number}>} An object with the count of deleted and errored accounts.
 */
export async function deleteInactiveVendors(): Promise<{deletedCount: number, errorCount: number}> {
  console.log("Starting job to delete inactive vendors...");
  
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const threeMonthsAgoTimestamp = Timestamp.fromDate(threeMonthsAgo);

  const usersRef = collection(db, "users");
  const vendorsRef = collection(db, "vendors");
  const productsRef = collection(db, "products");

  // Query for users who haven't logged in for 3 months
  const inactiveUsersQuery = query(usersRef, where("lastLogin", "<", threeMonthsAgoTimestamp));
  
  const inactiveUsersSnapshot = await getDocs(inactiveUsersQuery);

  if (inactiveUsersSnapshot.empty) {
    console.log("No inactive users found. Exiting job.");
    return { deletedCount: 0, errorCount: 0 };
  }

  let deletedCount = 0;
  let errorCount = 0;

  const batch = writeBatch(db);

  for (const userDoc of inactiveUsersSnapshot.docs) {
    const userId = userDoc.id;
    console.log(`Processing inactive user: ${userId}`);

    try {
      // Find the corresponding vendor account
      const vendorQuery = query(vendorsRef, where("uid", "==", userId));
      const vendorSnapshot = await getDocs(vendorQuery);

      if (!vendorSnapshot.empty) {
        const vendorDoc = vendorSnapshot.docs[0];
        const vendorId = vendorDoc.id;
        console.log(`Found inactive vendor: ${vendorId} (${vendorDoc.data().name}). Preparing for deletion.`);

        // Find all products associated with this vendor
        const productsQuery = query(productsRef, where("vendorId", "==", vendorId));
        const productsSnapshot = await getDocs(productsQuery);

        // Add product deletions to the batch
        if (!productsSnapshot.empty) {
          console.log(`Found ${productsSnapshot.size} products to delete for vendor ${vendorId}.`);
          productsSnapshot.forEach(productDoc => {
            batch.delete(productDoc.ref);
          });
        }
        
        // Add vendor and user document deletions to the batch
        batch.delete(vendorDoc.ref);
        batch.delete(userDoc.ref);
        
        deletedCount++;
      } else {
        console.log(`User ${userId} is inactive but has no vendor account. Deleting user only.`);
        batch.delete(userDoc.ref);
      }
    } catch (error) {
      console.error(`Failed to process user ${userId}:`, error);
      errorCount++;
    }
  }

  try {
    await batch.commit();
    console.log(`Successfully deleted ${deletedCount} vendor accounts and their associated products.`);
  } catch (error) {
    console.error("Error committing batch deletion:", error);
    errorCount += deletedCount; // If commit fails, all attempted deletions are errors
    deletedCount = 0;
  }

  console.log(`Job finished. Deleted: ${deletedCount}, Errors: ${errorCount}`);
  return { deletedCount, errorCount };
}
