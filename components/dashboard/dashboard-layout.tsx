'use client';

import { useState } from 'react';
import { User, UserMetadata, UserProfile } from '@prisma/client';
import { Sidebar } from './sidebar';
import { MainFeed } from './main-feed';
import { RightSidebar } from './right-sidebar';

interface DashboardLayoutProps {
  user: User & {
    metadata: UserMetadata | null;
    profile: UserProfile | null;
  };
}

export function DashboardLayout({ user }: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar 
              user={user} 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
            />
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            <MainFeed user={user} activeTab={activeTab} />
          </div>
          
          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <RightSidebar user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}