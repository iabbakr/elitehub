
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference');
  const accountNumber = searchParams.get('account_number');
  const bankCode = searchParams.get('bank_code');

  if (accountNumber && bankCode) {
    // This is an account verification request
    try {
        const response = await axios.get(
            `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Cache-Control': 'no-cache',
                },
            }
        );
        if (response.data && response.data.status === true) {
            return NextResponse.json({ success: true, data: response.data.data });
        } else {
             // Use the message from Paystack if available
             return NextResponse.json({ success: false, message: response.data.message || 'Could not verify account' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Paystack account verification error:', error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || 'Failed to verify bank account due to a server error.';
        return NextResponse.json({ success: false, message: errorMessage }, { status: error.response?.status || 500 });
    }

  } else if (reference) {
    // This is a transaction verification request
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );
      
      // Check if the transaction was successful
      if (response.data && response.data.data && response.data.data.status === 'success') {
          return NextResponse.json({ success: true, data: response.data.data });
      } else {
          return NextResponse.json({ success: false, message: response.data.data.gateway_response || 'Transaction not successful' }, { status: 400 });
      }
    } catch (error: any) {
      console.error('Paystack verification error:', error.response?.data || error.message);
      return NextResponse.json({ success: false, error: 'Failed to verify transaction' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid request. Provide either a transaction reference or account details.' }, { status: 400 });
}
