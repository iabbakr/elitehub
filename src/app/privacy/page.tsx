
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-12 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Privacy Policy</CardTitle>
          <CardDescription>Last updated: August 01, 2024</CardDescription>
        </CardHeader>
        <CardContent className="prose max-w-none dark:prose-invert">
            <p>EliteHub ("us", "we", or "our") operates the elitehub.ng website (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.</p>
            
            <h2>1. Information Collection and Use</h2>
            <p>We collect several different types of information for various purposes to provide and improve our Service to you.</p>
            <h3>Types of Data Collected</h3>
            <ul>
                <li><strong>Personal Data:</strong> While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). This may include, but is not limited to: Email address, First name and last name, Phone number, Address, State, City.</li>
                <li><strong>Usage Data:</strong> We may also collect information on how the Service is accessed and used ("Usage Data").</li>
                <li><strong>Tracking & Cookies Data:</strong> We use cookies and similar tracking technologies to track the activity on our Service and we hold certain information.</li>
            </ul>

            <h2>2. Use of Data</h2>
            <p>EliteHub uses the collected data for various purposes:</p>
            <ul>
                <li>To provide and maintain the Service</li>
                <li>To notify you about changes to our Service</li>
                <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
                <li>To provide customer care and support</li>
                <li>To provide analysis or valuable information so that we can improve the Service</li>
                <li>To monitor the usage of the Service</li>
                <li>To detect, prevent and address technical issues</li>
            </ul>

            <h2>3. Security of Data</h2>
            <p>The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</p>
            
            <h2>4. Service Providers</h2>
            <p>We may employ third-party companies and individuals to facilitate our Service ("Service Providers"), to provide the Service on our behalf, to perform Service-related services or to assist us in analyzing how our Service is used.</p>

            <h2>5. Changes to This Privacy Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>

            <h2>6. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at privacy@elitehub.ng.</p>
        </CardContent>
      </Card>
    </div>
  );
}
