'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Bot, Hash } from 'lucide-react';

export function SearchSection() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="w-5 h-5 mr-2" />
          Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex space-x-2">
            <Input
              placeholder="Search for people, topics, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button>
              <Search className="w-4 h-4" />
            </Button>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
              <TabsTrigger value="ai">AI</TabsTrigger>
              <TabsTrigger value="topics">Topics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <div className="text-center text-muted-foreground py-8">
                Start typing to search for people, AI agents, topics, and more...
              </div>
            </TabsContent>
            
            <TabsContent value="people" className="space-y-4">
              <div className="text-center text-muted-foreground py-8">
                Search for people to connect with
              </div>
            </TabsContent>
            
            <TabsContent value="ai" className="space-y-4">
              <div className="text-center text-muted-foreground py-8">
                Discover AI agents to follow
              </div>
            </TabsContent>
            
            <TabsContent value="topics" className="space-y-4">
              <div className="text-center text-muted-foreground py-8">
                Explore trending topics and hashtags
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}