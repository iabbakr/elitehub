
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Terms and Conditions</CardTitle>
          <CardDescription>Last updated: August 01, 2024</CardDescription>
        </CardHeader>
        <CardContent className="prose max-w-none dark:prose-invert">
          <p>Please read these terms and conditions carefully before using Our Service.</p>
          
          <h2>1. Introduction</h2>
          <p>Welcome to EliteHub! These Terms and Conditions govern your use of our website and services. By accessing or using the service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.</p>

          <h2>2. Accounts</h2>
          <p>When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
          <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.</p>

          <h2>3. Vendor Responsibilities</h2>
          <p>As a vendor on EliteHub, you agree to provide accurate and complete information about your products and services. You are solely responsible for the quality, safety, and legality of the products you sell. You must handle customer inquiries and disputes in a professional and timely manner.</p>
          
          <h2>4. Intellectual Property</h2>
          <p>The Service and its original content, features, and functionality are and will remain the exclusive property of EliteHub and its licensors. The Service is protected by copyright, trademark, and other laws of both Nigeria and foreign countries.</p>

          <h2>5. Links To Other Web Sites</h2>
          <p>Our Service may contain links to third-party web sites or services that are not owned or controlled by EliteHub. EliteHub has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third-party web sites or services.</p>

          <h2>6. Termination</h2>
          <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>

          <h2>7. Governing Law</h2>
          <p>These Terms shall be governed and construed in accordance with the laws of Nigeria, without regard to its conflict of law provisions.</p>
          
          <h2>8. Changes to These Terms</h2>
          <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>

          <h2>9. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at support@elitehub.ng.</p>
        </CardContent>
      </Card>
    </div>
  );
}
