
'use client';

import { Suspense, useEffect, useState } from 'react';
import { notFound, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { ChatInterface } from '@/components/ChatInterface';
import { useAuth } from '@/hooks/use-auth';
import { fetchVendorById, type Vendor, fetchUserByUid } from '@/lib/data';
import { Loader2 } from 'lucide-react';

function ChatPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [recipientUid, setRecipientUid] = useState<string | null>(null);
  const [isLoadingRecipient, setIsLoadingRecipient] = useState(true);

  const recipientIdParam = Array.isArray(params.vendorId) ? params.vendorId[0] : params.vendorId;

  useEffect(() => {
    const findRecipientUid = async () => {
      if (!recipientIdParam) {
        setIsLoadingRecipient(false);
        return;
      }
      
      // The param could be a vendor doc ID or a user UID. We need the UID.
      const vendor = await fetchVendorById(recipientIdParam);
      if (vendor && vendor.uid) {
        setRecipientUid(vendor.uid);
      } else {
        // Assume the param is already a UID if not a vendor ID
        const userExists = await fetchUserByUid(recipientIdParam);
        if (userExists) {
            setRecipientUid(recipientIdParam);
        }
      }
      setIsLoadingRecipient(false);
    };
    findRecipientUid();
  }, [recipientIdParam]);


  if (loading || isLoadingRecipient) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Loading Chat...</p>
      </div>
    );
  }

  if (!user) {
    // This could be a redirect or a login prompt.
    // useAuth hook now manages the initial loading state gracefully.
    return <p className="text-center">Please log in to access the chat.</p>;
  }
  
  if (!recipientUid) {
    notFound();
  }

  const chatRoomId = [user.uid, recipientUid].sort().join('_');

  return (
    <div className="max-w-7xl mx-auto h-[85vh]">
      <Card className="shadow-lg h-full flex flex-col">
        <CardContent className="flex-grow flex flex-col p-0">
          <ChatInterface 
            chatRoomId={chatRoomId} 
            senderId={user.uid} 
            recipientId={recipientUid}
          />
        </CardContent>
      </Card>
    </div>
  );
}


export default function ChatPage() {
    return (
      <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
        <ChatPageContent />
      </Suspense>
    );
}
