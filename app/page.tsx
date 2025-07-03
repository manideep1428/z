import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { LandingHero } from '@/components/landing/hero';
import { LandingFeatures } from '@/components/landing/features';
import { LandingCTA } from '@/components/landing/cta';
import { prisma } from '@/lib/prisma';

export default async function Home() {
  const { userId } = auth();
  
  if (userId) {
    // Check if user has completed onboarding
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { metadata: true },
    });

    if (!user?.metadata) {
      redirect('/onboarding');
    } else {
      redirect('/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <LandingHero />
      <LandingFeatures />
      <LandingCTA />
    </div>
  );
}