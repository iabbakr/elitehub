
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatInterface } from '@/components/ChatInterface';
import { Loader2, MessageSquareText, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchVendorByUid, fetchUserByUid } from '@/lib/data';

interface ChatRoom {
  id: string;
  otherParticipant: {
    uid: string; // The UID of the other person
    name: string;
    initials: string;
  };
  lastMessage: {
    text: string;
    timestamp: Date | null;
  };
}

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        const chatsQuery = query(
            collection(db, "chats"),
            where('participantIds', 'array-contains', user.uid)
        );

        const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
            const rooms: ChatRoom[] = [];
            for (const chatDoc of snapshot.docs) {
                const data = chatDoc.data();
                const otherUserUid = data.participantIds.find((id: string) => id !== user.uid);
                
                if (!otherUserUid) continue;
                
                let otherParticipantInfo = { uid: otherUserUid, name: 'User', initials: 'U' };

                const vendor = await fetchVendorByUid(otherUserUid);
                if (vendor) {
                    otherParticipantInfo = { uid: otherUserUid, name: vendor.name, initials: vendor.name.substring(0, 2).toUpperCase() };
                } else {
                    const otherUser = await fetchUserByUid(otherUserUid);
                    if(otherUser) {
                       otherParticipantInfo = { uid: otherUserUid, name: otherUser.fullName, initials: otherUser.fullName.substring(0,2).toUpperCase() };
                    }
                }
                
                const messagesQuery = query(collection(db, `chats/${chatDoc.id}/messages`), orderBy('timestamp', 'desc'), limit(1));
                const lastMessageSnapshot = await getDocs(messagesQuery);
                const lastMessage = lastMessageSnapshot.docs[0]?.data();
                
                rooms.push({
                    id: chatDoc.id,
                    otherParticipant: otherParticipantInfo,
                    lastMessage: {
                        text: lastMessage?.text || 'No messages yet',
                        timestamp: lastMessage?.timestamp?.toDate() || null
                    }
                });
            }
            
            rooms.sort((a, b) => (b.lastMessage.timestamp?.getTime() || 0) - (a.lastMessage.timestamp?.getTime() || 0));
            setChatRooms(rooms);
            setIsLoadingChats(false);

            if (!selectedChat && rooms.length > 0) {
                setSelectedChat(rooms[0]);
            } else if (selectedChat) {
                const updatedSelectedChat = rooms.find(r => r.id === selectedChat.id);
                setSelectedChat(updatedSelectedChat || null);
            }
        });

        return () => unsubscribe();
      }
    }
}, [user, loading, router, selectedChat]);

  if (loading || isLoadingChats) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Loading Messages...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Should be redirected by the effect
  }

  return (
     <div className="max-w-7xl mx-auto">
        <header className="mb-8 hidden md:block">
            <h1 className="text-4xl font-bold font-headline tracking-tight text-foreground flex items-center gap-3">
                <MessageSquareText className="h-10 w-10 text-primary"/>
                My Messages
            </h1>
        </header>
        <div className={cn("md:shadow-lg md:h-[85vh] md:flex md:border md:rounded-lg", !selectedChat ? "flex" : "block md:flex")}>
            <div className={cn(
                "w-full md:w-[350px] md:border-r flex flex-col",
                selectedChat && "hidden md:flex"
            )}>
                <div className="p-4 border-b">
                     <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Users className="h-6 w-6"/>
                        Conversations
                    </h2>
                </div>
                <ScrollArea className="flex-grow">
                    {chatRooms.length > 0 ? (
                        chatRooms.map(room => (
                            <div
                                key={room.id}
                                className={cn(
                                    "p-4 border-b cursor-pointer hover:bg-muted/50",
                                    selectedChat?.id === room.id && "bg-muted"
                                )}
                                onClick={() => setSelectedChat(room)}
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback>{room.otherParticipant.initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow overflow-hidden">
                                        <p className="font-semibold">{room.otherParticipant.name}</p>
                                        <p className="text-sm text-muted-foreground truncate">{room.lastMessage.text}</p>
                                    </div>
                                    {room.lastMessage.timestamp && (
                                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                                            {room.lastMessage.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                         <div className="p-8 text-center text-muted-foreground">
                            No conversations yet.
                         </div>
                    )}
                </ScrollArea>
            </div>
            <div className={cn(
                "flex-1 flex flex-col h-screen md:h-auto",
                !selectedChat && "hidden md:flex"
            )}>
                {selectedChat ? (
                     <ChatInterface
                        key={selectedChat.id}
                        chatRoomId={selectedChat.id}
                        senderId={user.uid}
                        recipientId={selectedChat.otherParticipant.uid} // Always pass the UID
                        onBack={() => setSelectedChat(null)}
                        isMobileView={true}
                    />
                ) : (
                    <div className="flex flex-col justify-center items-center h-full text-muted-foreground">
                        <MessageSquareText className="h-24 w-24" />
                        <p className="mt-4 text-lg">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
     </div>
  );
}
