

'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, doc, setDoc, writeBatch, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Check, CheckCheck, ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from './ui/avatar';
import { fetchVendorByUid, fetchUserByUid } from '@/lib/data';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp;
  status: 'sent' | 'delivered' | 'read';
}

interface ChatInterfaceProps {
  chatRoomId: string;
  senderId: string;
  recipientId: string; // This will always be a UID now
  onBack?: () => void;
  isMobileView?: boolean;
}

interface UserDetails {
  name: string;
  initials: string;
}

export function ChatInterface({ chatRoomId, senderId, recipientId, onBack, isMobileView = false }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState<Record<string, UserDetails>>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchParticipantDetails = async () => {
      const ids = [senderId, recipientId];
      const details: Record<string, UserDetails> = {};

      const fetchUserDetails = async (uid: string) => {
        // A user could be a vendor or a regular user. Check vendor first.
        const vendor = await fetchVendorByUid(uid);
        if (vendor) {
            return { name: vendor.name, initials: vendor.name.substring(0, 2).toUpperCase() };
        }
        
        const user = await fetchUserByUid(uid);
        if (user) {
            return { name: user.fullName, initials: user.fullName.substring(0, 2).toUpperCase() };
        }
        
        return { name: 'User', initials: 'U' };
      };
      
      for (const id of ids) {
        details[id] = await fetchUserDetails(id);
      }
      setParticipants(details);
    };

    fetchParticipantDetails();
  }, [senderId, recipientId]);

  useEffect(() => {
    const messagesCollectionRef = collection(db, 'chats', chatRoomId, 'messages');
    const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const msgs: Message[] = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
      
      // Mark incoming messages as 'read'
      const unreadMessages = querySnapshot.docs
          .filter(doc => doc.data().senderId === recipientId && doc.data().status !== 'read');

      if (unreadMessages.length > 0) {
          const batch = writeBatch(db);
          unreadMessages.forEach(msgDoc => {
              batch.update(msgDoc.ref, { status: 'read' });
          });
          await batch.commit();
      }
    });

    return () => unsubscribe();
  }, [chatRoomId, recipientId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const chatDocRef = doc(db, 'chats', chatRoomId);
    const messagesCollectionRef = collection(chatDocRef, 'messages');
    
    await setDoc(chatDocRef, { 
        participantIds: [senderId, recipientId].sort(),
        lastUpdated: serverTimestamp() 
    }, { merge: true });

    await addDoc(messagesCollectionRef, {
      text: newMessage,
      senderId,
      timestamp: serverTimestamp(),
      status: 'sent',
    });

    setNewMessage('');
  };
  
  const getParticipantDetails = (id: string) => {
    return participants[id] || { name: 'Loading...', initials: '?' };
  };

  const renderTicks = (message: Message) => {
    if (message.senderId !== senderId) return null;
    if (message.status === 'read') {
      return <CheckCheck className="h-4 w-4 text-blue-500" />;
    }
    if (message.status === 'delivered') {
        return <CheckCheck className="h-4 w-4 text-muted-foreground" />;
    }
    if (message.status === 'sent') {
      return <Check className="h-4 w-4 text-muted-foreground" />;
    }
    return null;
  }

  const recipientDetails = getParticipantDetails(recipientId);

  return (
    <div className="h-full flex flex-col">
       <div className="flex items-center p-3 border-b bg-background">
          {onBack && isMobileView && (
            <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {recipientDetails && (
             <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarFallback>{recipientDetails.initials}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{recipientDetails.name}</p>
                </div>
            </div>
          )}
      </div>
      <ScrollArea className="flex-grow p-4 bg-muted/20" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex items-end gap-2',
                message.senderId === senderId ? 'justify-end' : 'justify-start'
              )}
            >
              {message.senderId !== senderId && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getParticipantDetails(recipientId).initials}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 flex flex-col shadow-sm',
                  message.senderId === senderId
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-background rounded-bl-none'
                )}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                 <div className="flex items-center justify-end gap-1.5 self-end mt-1">
                    <span className={cn(
                        "text-xs",
                        message.senderId === senderId ? "text-primary-foreground/70" : "text-muted-foreground/70"
                    )}>
                        {message.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                    </span>
                    {renderTicks(message)}
                </div>
              </div>
               {message.senderId === senderId && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getParticipantDetails(senderId).initials}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            autoComplete="off"
            className="flex-grow"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
