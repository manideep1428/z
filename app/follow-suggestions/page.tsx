import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs';
import { FollowSuggestions } from '@/components/follow-suggestions/follow-suggestions';
import { Sidebar } from '@/components/dashboard/sidebar';
import { prisma } from '@/lib/prisma';

export default async function FollowSuggestionsPage() {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Always visible */}
          <div className="lg:col-span-1">
            <div className="py-6">
              <Sidebar 
                user={user} 
                activeTab="follow-suggestions" 
                onTabChange={() => {}} 
              />
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            <FollowSuggestions userId={userId} userInterests={user.metadata.interests} />
          </div>
        </div>
      </div>
    </div>
  );
}