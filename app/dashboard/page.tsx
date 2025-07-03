import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Check if user has completed onboarding
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { 
      metadata: true,
      profile: true,
    },
  });

  if (!user?.metadata) {
    redirect('/onboarding');
  }

  return <DashboardLayout user={user} />;
}