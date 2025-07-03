'use client';

import { User, UserMetadata, UserProfile } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, Heart, MessageCircle, UserPlus, Bot, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useNotifications, useMarkNotificationRead } from '@/hooks/use-notifications';

interface NotificationsSectionProps {
  user: User & {
    metadata: UserMetadata | null;
    profile: UserProfile | null;
  };
}

export function NotificationsSection({ user }: NotificationsSectionProps) {
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsReadMutation = useMarkNotificationRead();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (notificationId?: string) => {
    try {
      await markAsReadMutation.mutateAsync({
        notificationId,
        markAllAsRead: !notificationId,
      });
      
      if (notificationId) {
        toast.success('Notification marked as read');
      } else {
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      toast.error('Failed to update notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LIKE':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'REPLY':
      case 'AI_REPLY':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'MENTION':
      case 'AI_MENTION':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'FOLLOW':
        return <UserPlus className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getNotificationText = (notification: any) => {
    const actorName = notification.actor?.profile?.displayName || 'Someone';
    
    switch (notification.type) {
      case 'LIKE':
        return `${actorName} liked your post`;
      case 'REPLY':
        return `${actorName} replied to your post`;
      case 'AI_REPLY':
        return `${actorName} replied to your post`;
      case 'MENTION':
        return `${actorName} mentioned you in a post`;
      case 'AI_MENTION':
        return `${actorName} mentioned you in a post`;
      case 'FOLLOW':
        return `${actorName} started following you`;
      default:
        return `${actorName} interacted with your content`;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                <Bell className="w-6 h-6 mr-3 text-primary" />
                Notifications
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Stay updated with your social interactions
              </p>
            </div>
            {unreadCount > 0 && (
              <Button 
                onClick={() => markAsRead()}
                variant="outline"
                className="flex items-center gap-2"
                disabled={markAsReadMutation.isPending}
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Notifications */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          {notifications.length > 0 ? (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start space-x-3 p-4 hover:bg-muted/50 transition-all duration-200 cursor-pointer group ${
                    !notification.isRead ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                  }`}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                >
                  <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                    <AvatarImage 
                      src={notification.actor?.profile?.avatarUrl} 
                      alt={notification.actor?.profile?.displayName} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                      {notification.actor?.profile?.displayName?.split(' ').map(n => n[0]).join('') || '?'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${!notification.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        {getNotificationText(notification)}
                      </span>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                    
                    {notification.post && (
                      <p className="text-sm text-muted-foreground line-clamp-2 bg-muted/30 p-2 rounded">
                        "{notification.post.content}"
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      {getNotificationIcon(notification.type)}
                      <span>
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      disabled={markAsReadMutation.isPending}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No notifications yet
              </h3>
              <p className="text-sm text-muted-foreground">
                When people interact with your posts, you'll see notifications here!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}