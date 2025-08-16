
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { fetchNotifications, markAllNotificationsAsRead, type Notification } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Bell, CheckCheck, MessageSquare, Star, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const getNotifications = async (uid: string) => {
    setLoadingData(true);
    const fetchedNotifications = await fetchNotifications(uid);
    setNotifications(fetchedNotifications);
    setLoadingData(false);
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      getNotifications(user.uid);
    }
  }, [user, authLoading, router]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.uid);
    // Refresh notifications from the server to get the updated read status
    await getNotifications(user.uid);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch(type) {
      case 'review': return <Star className="h-5 w-5 text-yellow-500" />;
      case 'reply': return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'application_approved': return <UserCheck className="h-5 w-5 text-green-500" />;
      case 'kyc_approved': return <UserCheck className="h-5 w-5 text-green-500" />;
      case 'kyc_rejected': return <UserCheck className="h-5 w-5 text-destructive" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  }

  const getNotificationLink = (notification: Notification) => {
     switch(notification.type) {
        case 'review':
        case 'reply':
            return `/products/${notification.productId}`;
        case 'application_approved':
        case 'kyc_approved':
        case 'kyc_rejected':
            // This could link to the user's specific provider profile page
            return `/profile`; 
        default:
            return '#';
     }
  }

  if (authLoading || loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Loading Notifications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>All your recent account activity.</CardDescription>
          </div>
          {notifications.some(n => !n.isRead) && (
            <Button onClick={handleMarkAllRead}>
              <CheckCheck className="mr-2 h-4 w-4"/>
              Mark all as read
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <ul className="space-y-4">
              {notifications.map(notif => (
                <li key={notif.id}>
                   <Link
                    href={getNotificationLink(notif)}
                    className={cn(
                        "block p-4 rounded-lg transition-colors",
                        notif.isRead ? "bg-background hover:bg-muted/50" : "bg-primary/10 hover:bg-primary/20"
                    )}
                   >
                    <div className="flex items-start gap-4">
                        <div className="mt-1">
                            {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold">{notif.senderName}</p>
                            <p className="text-sm text-muted-foreground">{notif.type.replace(/_/g, ' ')}</p>
                            <p className="mt-1 text-sm">{notif.text}</p>
                             <p className="text-xs text-muted-foreground mt-2">{new Date(notif.timestamp?.toDate()).toLocaleString()}</p>
                        </div>
                    </div>
                   </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Bell className="mx-auto h-12 w-12" />
              <p className="mt-4">You have no notifications yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
