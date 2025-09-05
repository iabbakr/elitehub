
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { UserData } from '@/lib/data';

// A subset of Nigerian banks supported by Paystack
const banks = [
  { name: 'Access Bank', code: '044' },
  { name: 'Citibank Nigeria', code: '023' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'Opay', code: '999992' },
  { name: 'Palmpay', code: '999991' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Suntrust Bank', code: '100' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'United Bank for Africa', code: '033' },
  { name: 'Unity Bank', code: '215' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
];


const formSchema = z.object({
  accountNumber: z.string().length(10, 'Account number must be 10 digits.'),
  bankCode: z.string().min(1, 'Please select a bank.'),
});

interface BankAccountFormProps {
    user: UserData;
    onUpdate: (details: { accountName: string; accountNumber: string; bankName: string; }) => void;
}

export function BankAccountForm({ user, onUpdate }: BankAccountFormProps) {
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedName, setVerifiedName] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountNumber: user.accountNumber || '',
      bankCode: banks.find(b => b.name === user.bankName)?.code || '',
    },
  });
  
  const selectedBankCode = form.watch('bankCode');
  const accountNumberValue = form.watch('accountNumber');

  const handleVerify = async () => {
    if (!accountNumberValue || !selectedBankCode) {
      toast({ variant: 'destructive', title: 'Please enter account number and select a bank.' });
      return;
    }
    setIsVerifying(true);
    setVerifiedName('');
    try {
      const res = await fetch(`/api/paystack/verify?account_number=${accountNumberValue}&bank_code=${selectedBankCode}`);
      const data = await res.json();
      if (data.success) {
        setVerifiedName(data.data.account_name);
        toast({ title: 'Account Verified!', description: `Name: ${data.data.account_name}` });
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Verification Failed', description: error.message });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = () => {
    if (!verifiedName) {
      toast({ variant: 'destructive', title: 'Please verify your account first.' });
      return;
    }
    const bankName = banks.find(b => b.code === selectedBankCode)?.name || '';
    onUpdate({
        accountName: verifiedName,
        accountNumber: accountNumberValue,
        bankName,
    });
    toast({ title: 'Bank Details Saved!' });
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
        <FormField
          control={form.control}
          name="bankCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {banks.map(bank => (
                    <SelectItem key={bank.code} value={bank.code}>{bank.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="accountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Number</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="0123456789" {...field} />
                </FormControl>
                <Button type="button" onClick={handleVerify} disabled={isVerifying || !selectedBankCode || accountNumberValue.length !== 10}>
                    {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Verify
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        {(verifiedName || user.accountName) && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-800">
                <p className="font-semibold">Account Name: {verifiedName || user.accountName}</p>
            </div>
        )}
        <Button type="submit" className="w-full" disabled={!verifiedName && !user.accountName}>
          Save Bank Details
        </Button>
      </form>
    </Form>
  );
}
