
import { NextResponse } from 'next/server';
import { deleteInactiveVendors } from '@/lib/cron';

// This is a simple security measure. 
// In a production environment, you should use a more robust solution,
// like validating a secret key or checking the request origin.
const CRON_SECRET = process.env.CRON_SECRET || 'your-super-secret-cron-key';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { deletedCount, errorCount } = await deleteInactiveVendors();
    return NextResponse.json({
      message: 'Cron job executed successfully.',
      deletedCount,
      errorCount,
    });
  } catch (error) {
    console.error('Error executing cron job:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
