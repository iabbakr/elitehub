'use client';

import { useState, useMemo } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Minus, Plus, Trash2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type CartItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    dataAiHint: string;
};

export default function CheckoutPage() {
  // In a real app, cart items would be managed globally (e.g., via Context or Zustand)
  // For this demo, we'll keep it as local state.
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(id);
    } else {
      setCartItems(cartItems.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
    }
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };
  
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cartItems]);

  const shipping = 5000;
  const total = subtotal + shipping;

  const config = {
      reference: (new Date()).getTime().toString(),
      email: email,
      amount: Math.round(total * 100), // Amount is in kobo
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = (reference: any) => {
    // In a real app, you would send this reference to your server to verify the payment.
    console.log('Payment successful. Reference:', reference);
    toast({
      title: 'Payment Successful!',
      description: 'Your order has been placed.',
    });
    setCartItems([]);
    setEmail('');
  };

  const onClose = () => {
    // User closed the popup
    console.log('Payment popup closed.');
    toast({
      variant: 'destructive',
      title: 'Payment Cancelled',
      description: 'You have cancelled the payment process.',
    });
  };

  const handlePay = () => {
    if (!email) {
       toast({
        variant: 'destructive',
        title: 'Email required',
        description: 'Please enter your email address to proceed.',
      });
      return;
    }
    initializePayment({onSuccess, onClose});
  }

  return (
    <div>
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground">
          Secure Checkout
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          You're just a few steps away from completing your trusted purchase.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Payment Details Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {/* The rest of the form can be removed as Paystack handles card details */}
            <div className="text-sm text-muted-foreground text-center p-4 border rounded-md">
                You will be redirected to Paystack's secure payment page to enter your card details.
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full text-lg py-6" disabled={cartItems.length === 0} onClick={handlePay}>
              Pay ₦{total.toLocaleString()}
            </Button>
          </CardFooter>
        </Card>

        {/* Order Summary */}
        <Card className="shadow-lg bg-muted/20">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {cartItems.length > 0 ? (
                <>
                    <div className="space-y-4">
                    {cartItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Image src={item.image} alt={item.name} width={64} height={64} className="rounded-md" data-ai-hint={item.dataAiHint}/>
                            <div>
                            <p className="font-semibold">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-sm w-4 text-center">{item.quantity}</span>
                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-medium">₦{(item.price * item.quantity).toLocaleString()}</p>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveItem(item.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        </div>
                    ))}
                    </div>
                    <Separator className="my-6" />
                    <div className="space-y-2">
                    <div className="flex justify-between">
                        <p className="text-muted-foreground">Subtotal</p>
                        <p className="font-medium">₦{subtotal.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between">
                        <p className="text-muted-foreground">Shipping</p>
                        <p className="font-medium">₦{shipping.toLocaleString()}</p>
                    </div>
                    </div>
                    <Separator className="my-6" />
                    <div className="flex justify-between text-xl font-bold">
                    <p>Total</p>
                    <p>₦{total.toLocaleString()}</p>
                    </div>
                </>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <XCircle className="mx-auto h-12 w-12" />
                    <p className="mt-4">Your cart is empty.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
       <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>Payments are securely processed by our partners.</p>
        <div className="flex justify-center items-center gap-4 mt-2">
            <span>Paystack</span> | <span>Flutterwave</span>
        </div>
      </div>
    </div>
  )
}
