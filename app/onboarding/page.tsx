import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs';
import { OnboardingForm } from '@/components/onboarding/onboarding-form';
import { prisma } from '@/lib/prisma';

export default async function OnboardingPage() {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Check if user already has metadata
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { metadata: true },
  });

  if (existingUser?.metadata) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-2xl mx-auto p-6">
        <OnboardingForm userId={userId} />
      </div>
    </div>
  );
}