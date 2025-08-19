
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
  }

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

