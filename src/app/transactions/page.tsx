
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { fetchOrdersByUserId, type Order } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(true);


  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      const getTransactions = async () => {
        const userOrders = await fetchOrdersByUserId(user.uid);
        setOrders(userOrders);
        setLoadingData(false);
      }
      getTransactions();
    }
  }, [user, authLoading, router]);


  if (authLoading || loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground">
          My Purchases
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          A record of all your purchases on EliteHub.
        </p>
      </header>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>Here's a list of your recent purchases.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length > 0 ? (
                  orders.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>${transaction.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={transaction.status === 'Delivered' ? 'default' : 'secondary'}
                          className={transaction.status === 'Delivered' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      You have no transaction history yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
