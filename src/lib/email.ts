
'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const fromEmail = 'EliteHub <onboarding@elitehubng.com>';

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: 'Welcome to EliteHub Marketplace!',
      html: `
        <h1>Welcome, ${name}!</h1>
        <p>Thank you for joining EliteHub, Nigeria's most trusted marketplace for verified vendors and professionals.</p>
        <p>You can now start exploring products, connecting with service providers, and enjoying a secure shopping experience.</p>
        <p>If you're interested in selling or offering services, you can apply to become a vendor or provider right from your profile.</p>
        <br>
        <p>Happy browsing!</p>
        <p>The EliteHub Team</p>
      `,
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // We don't throw the error to avoid blocking the user registration flow
  }
}

export async function sendApprovalEmail(to: string, name: string, providerType: string, profileUrl: string) {
  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Congratulations! Your ${providerType} Application has been Approved`,
      html: `
        <h1>Congratulations, ${name}!</h1>
        <p>We are thrilled to inform you that your application to become a <strong>${providerType}</strong> on EliteHub has been approved.</p>
        <p>Your account has been upgraded, and you can now access your professional dashboard to manage your profile, list your services or products, and connect with clients.</p>
        <p>You can view and manage your new profile here:</p>
        <a href="${profileUrl}" style="display: inline-block; padding: 10px 20px; background-color: #F44336; color: #ffffff; text-decoration: none; border-radius: 5px;">Go to My Profile</a>
        <br>
        <p>Welcome to our community of trusted professionals!</p>
        <p>The EliteHub Team</p>
      `,
    });
  } catch (error) {
    console.error(`Failed to send ${providerType} approval email:`, error);
  }
}
