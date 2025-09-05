

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { PayoutRequest } from '@/lib/data';
import { Banknote, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from '../ui/textarea';


type PayoutsPageClientProps = {
    initialRequests: PayoutRequest[];
    handlePayoutDecision: (requestId: string, decision: 'paid' | 'rejected', reason?: string) => Promise<void>;
};

export function PayoutsPageClient({ initialRequests, handlePayoutDecision }: PayoutsPageClientProps) {
  const [requests, setRequests] = useState<PayoutRequest[]>(initialRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'paid' | 'rejected'>('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  const handleDecision = async (request: PayoutRequest, decision: 'paid' | 'rejected') => {
    if (decision === 'rejected' && !rejectionReason) {
        toast({ variant: 'destructive', title: 'Rejection reason is required.' });
        return;
    }
    setLoadingId(request.id);
    try {
        await handlePayoutDecision(request.id, decision, rejectionReason);
        toast({ title: `Request ${decision}`, description: `Payout for ${request.userName} has been marked as ${decision}.` });
        
        // Optimistically update the UI
        const newRequests = requests.filter(r => r.id !== request.id);
        setRequests(newRequests);

    } catch (error: any) {
        console.error(`Error marking as ${decision}:`, error);
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update status.' });
    } finally {
        setLoadingId(null);
        setRejectionReason('');
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(r => r.status === filter);
  }, [requests, filter]);

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline tracking-tight text-foreground flex items-center gap-3">
            <Banknote className="h-10 w-10 text-primary" />Payout Requests
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">Review and manage user payout requests for referral earnings.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>Manage payout requests from users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
             <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
                 <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Bank Details</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRequests.length > 0 ? filteredRequests.map((request) => (
                            <TableRow key={request.id}>
                                <TableCell>
                                    <div className="font-medium">{request.userName}</div>
                                    <div className="text-sm text-muted-foreground">{request.userEmail}</div>
                                </TableCell>
                                <TableCell className="font-semibold">₦{request.amount.toLocaleString()}</TableCell>
                                <TableCell>
                                    <div>{request.accountName}</div>
                                    <div className="text-sm text-muted-foreground">{request.bankName} - {request.accountNumber}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">{new Date(request.status === 'pending' ? request.requestedAt : (request.paidAt || request.requestedAt)!).toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">{request.status === 'pending' ? 'Requested' : (request.status === 'paid' ? 'Paid' : 'Rejected')}</div>
                                </TableCell>
                                <TableCell className="text-right">
                                    {request.status === 'pending' && (
                                      <div className="flex gap-2 justify-end">
                                        <Button size="sm" onClick={() => handleDecision(request, 'paid')} disabled={!!loadingId} variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700">
                                            {loadingId === request.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                                            Mark as Paid
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" variant="destructive" disabled={!!loadingId}>
                                                    <XCircle className="mr-2 h-4 w-4" /> Reject
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Reject Payout Request?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        The requested amount will be returned to the user's balance. Please provide a reason for rejection.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <Textarea
                                                    placeholder="Enter reason for rejection..."
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                />
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDecision(request, 'rejected')}>
                                                        Confirm Rejection
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    )}
                                     {request.status === 'paid' && (
                                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Completed
                                        </Badge>
                                    )}
                                     {request.status === 'rejected' && (
                                        <Badge variant="destructive">
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Rejected
                                        </Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        )) : (
                             <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No {filter} requests found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
