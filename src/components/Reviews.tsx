

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, runTransaction, where, Timestamp } from 'firebase/firestore';
import type { Review, Reply, Product, Vendor, UserData } from '@/lib/data';
import { createNotification } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Star, Send } from 'lucide-react';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return '';
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate().toLocaleString([], {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    return new Date(timestamp).toLocaleString();
};

export function Reviews({ product, vendor }: { product: Product, vendor: Vendor | null }) {
  const { user, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReviewText, setNewReviewText] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    const reviewsRef = collection(db, 'products', product.id, 'reviews');
    const q = query(reviewsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const fetchedReviews: Review[] = [];
    let hasReviewed = false;
    for (const doc of snapshot.docs) {
      const reviewData = { id: doc.id, ...doc.data() } as Review;
      if (user && reviewData.authorId === user.uid) {
        hasReviewed = true;
      }
      // Fetch replies for each review
      const repliesRef = collection(db, 'products', product.id, 'reviews', doc.id, 'replies');
      const repliesQuery = query(repliesRef, orderBy('timestamp', 'asc'));
      const repliesSnapshot = await getDocs(repliesQuery);
      reviewData.replies = repliesSnapshot.docs.map(replyDoc => ({ id: replyDoc.id, ...replyDoc.data() } as Reply));
      fetchedReviews.push(reviewData);
    }
    setReviews(fetchedReviews);
    setUserHasReviewed(hasReviewed);
    setLoading(false);
  };

   useEffect(() => {
    if (user) {
       const userDocRef = doc(db, 'users', user.uid);
       getDocs(query(collection(db, 'users'), where('uid', '==', user.uid))).then(snapshot => {
         if (!snapshot.empty) {
           setUserData(snapshot.docs[0].data() as UserData);
         }
       })
    }
   }, [user]);

  useEffect(() => {
    fetchReviews();
  }, [product.id, user]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) {
      toast({ variant: 'destructive', title: 'Please log in to leave a review.' });
      router.push('/login');
      return;
    }
    if ((newRating === 0 && !userHasReviewed) || newReviewText.trim() === '') {
      toast({ variant: 'destructive', title: 'Please provide a rating and a comment.' });
      return;
    }

    try {
      const productRef = doc(db, 'products', product.id);
      const reviewsRef = collection(db, 'products', product.id, 'reviews');
      let newReviewId = '';
      
      await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) {
          throw "Product does not exist!";
        }
        
        // Only update product rating if a new rating was actually provided
        if (newRating > 0) {
            const currentData = productDoc.data();
            const newReviewsCount = (currentData.reviewsCount || 0) + 1;
            const newTotalRating = (currentData.rating * (currentData.reviewsCount || 0)) + newRating;
            const newAverageRating = newTotalRating / newReviewsCount;
            
            transaction.update(productRef, {
                reviewsCount: newReviewsCount,
                rating: newAverageRating
            });
        }
        
        const newReviewRef = doc(reviewsRef);
        newReviewId = newReviewRef.id;
        transaction.set(newReviewRef, {
            authorId: user.uid,
            authorName: userData.fullName,
            rating: newRating, // Can be 0 if it's a follow-up comment
            comment: newReviewText,
            timestamp: serverTimestamp(),
        });
      });
      
      // Create notification for the vendor
      if (vendor?.uid && vendor.uid !== user.uid) {
          createNotification({
              recipientId: vendor.uid,
              senderId: user.uid,
              senderName: userData.fullName,
              type: 'review',
              productId: product.id,
              productName: product.name,
              text: newReviewText.substring(0, 50) + '...',
              isRead: false,
              timestamp: serverTimestamp()
          });
      }

      toast({ title: 'Review submitted!', description: 'Thank you for your feedback.' });
      setNewReviewText('');
      setNewRating(0);
      fetchReviews(); // Refresh reviews
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({ variant: 'destructive', title: 'Failed to submit review.' });
    }
  };

  const handleReplySubmit = async (review: Review) => {
    if (!user || !userData) {
        toast({ variant: 'destructive', title: 'Please log in to reply.' });
        router.push('/login');
        return;
    }
    if (replyText.trim() === '') return;

    const replyRef = collection(db, 'products', product.id, 'reviews', review.id, 'replies');
    await addDoc(replyRef, {
      authorId: user.uid,
      authorName: userData.fullName,
      text: replyText,
      timestamp: serverTimestamp(),
    });

    // Notify original commenter
    if (review.authorId !== user.uid) {
        createNotification({
            recipientId: review.authorId,
            senderId: user.uid,
            senderName: userData.fullName,
            type: 'reply',
            productId: product.id,
            productName: product.name,
            text: replyText.substring(0, 50) + '...',
            isRead: false,
            timestamp: serverTimestamp()
        });
    }

    // Notify vendor if replier is not the vendor
    if (vendor?.uid && vendor.uid !== user.uid) {
         createNotification({
            recipientId: vendor.uid,
            senderId: user.uid,
            senderName: userData.fullName,
            type: 'reply',
            productId: product.id,
            productName: product.name,
            text: `replied to a comment on your product: ${replyText.substring(0, 30)}...`,
            isRead: false,
            timestamp: serverTimestamp()
        });
    }

    setReplyText('');
    setReplyingTo(null);
    fetchReviews(); // Refresh reviews to show new reply
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Reviews & Ratings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Review Form */}
        {user && (
          <form onSubmit={handleReviewSubmit} className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold">{userHasReviewed ? "Add a comment" : "Write a Review"}</h3>
             {!userHasReviewed && (
                <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                    <Star
                    key={i}
                    className={cn(
                        'h-7 w-7 cursor-pointer',
                        (hoverRating || newRating) > i ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    )}
                    onClick={() => setNewRating(i + 1)}
                    onMouseEnter={() => setHoverRating(i + 1)}
                    onMouseLeave={() => setHoverRating(0)}
                    />
                ))}
                </div>
            )}
            <Textarea
              placeholder="Share your experience with this product..."
              value={newReviewText}
              onChange={(e) => setNewReviewText(e.target.value)}
            />
            <Button type="submit">Submit</Button>
          </form>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {loading ? (
            <p>Loading reviews...</p>
          ) : reviews.length > 0 ? (
            reviews.map((review, index) => (
              <div key={review.id}>
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarFallback>{review.authorName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                       <div>
                            <div className="flex items-center gap-2">
                                <p className="font-semibold">{review.authorName}</p>
                                <p className="text-xs text-muted-foreground">{formatTimestamp(review.timestamp)}</p>
                            </div>
                           {review.rating > 0 && (
                            <div className="flex text-yellow-500">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                                ))}
                            </div>
                           )}
                       </div>
                       <Button variant="link" size="sm" onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}>
                         Reply
                       </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                   
                    {/* Replies */}
                    <div className="mt-4 pl-6 border-l-2 space-y-4">
                        {review.replies?.map(reply => (
                           <div key={reply.id} className="flex items-start gap-3">
                               <Avatar className="w-8 h-8">
                                 <AvatarFallback>{reply.authorName.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-sm">{reply.authorName} {reply.authorId === vendor?.uid && <span className="text-xs text-primary bg-primary/10 p-1 rounded-sm">Vendor</span>}</p>
                                        <p className="text-xs text-muted-foreground">{formatTimestamp(reply.timestamp)}</p>
                                    </div>
                                  <p className="text-sm text-muted-foreground">{reply.text}</p>
                               </div>
                           </div>
                        ))}
                    </div>

                    {/* Reply Form */}
                    {replyingTo === review.id && (
                       <div className="mt-4 pl-6">
                         <div className="flex gap-2">
                           <Textarea
                             placeholder={`Replying to ${review.authorName}...`}
                             value={replyText}
                             onChange={(e) => setReplyText(e.target.value)}
                             rows={2}
                           />
                           <Button size="icon" onClick={() => handleReplySubmit(review)}><Send className="h-4 w-4"/></Button>
                         </div>
                       </div>
                    )}
                  </div>
                </div>
                {index < reviews.length - 1 && <Separator className="mt-6" />}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Be the first to review this product.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
