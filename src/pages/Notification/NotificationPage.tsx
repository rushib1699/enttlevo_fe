import { getNotificationsbyUserId } from '@/api'
import { useApplicationContext } from '@/hooks/useApplicationContext';
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { Loader2, Bell, Calendar, User } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

interface Notification {
  id: number;
  activity: string;
  date: string;
  time: string;
  type: string;
  description: string;
  lead_name: string;
  is_complete: number;
  created_at?: string;
  updated_at?: string;
  is_active?: number;
  is_deleted?: number;
  created_by?: number;
  updated_by?: number;
  leads_id?: number;
  company_id?: number;
  company_name?: string | null;
}

const NotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { loginResponse } = useApplicationContext();
  
  const fetchNotifications = async () => {
    setLoading(true);
    try {
        const response = await getNotificationsbyUserId({
            company_id: loginResponse?.company_id || 0,
            user_id: loginResponse?.id || 0,
        });
        setNotifications(response);
    } catch (error) {
        console.log(error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [loginResponse]);

  const groupNotifications = () => {
    const today: Notification[] = [];
    const tomorrow: Notification[] = [];
    const other: Notification[] = [];

    notifications.forEach(notification => {
      const date = parseISO(notification.date);
      if (isToday(date)) {
        today.push(notification);
      } else if (isTomorrow(date)) {
        tomorrow.push(notification);
      } else {
        other.push(notification);
      }
    });

    return { today, tomorrow, other };
  };

  const { today, tomorrow, other } = groupNotifications();

  const getNotificationTypeColor = (type: string) => {
    switch(type.toLowerCase()) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800';
      case 'task':
        return 'bg-green-100 text-green-800';
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800';
      case 'call':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const NotificationCard = ({ title, notifications, icon }: { title: string, notifications: Notification[], icon: React.ReactNode }) => (
    <Card className="shadow-sm rounded-lg border-t-4 border-t-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle>{title}</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            {notifications.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No notifications {title.toLowerCase()}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="group p-4 rounded-lg bg-white hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2 text-slate-900">
                    {notification.activity}
                    <Badge className={`${getNotificationTypeColor(notification.type)} font-medium`}>
                      {notification.type}
                    </Badge>
                  </h3>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full">
                    <Calendar className="h-4 w-4 text-slate-600" />
                    <span className="text-sm text-slate-600 font-medium">
                      {format(parseISO(`${notification.date.split('T')[0]}T${notification.time}`), 'MMM dd, yyyy h:mm a')}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">{notification.description}</p>
                <div className="flex items-center gap-3 text-sm bg-slate-50 w-fit px-3 py-1.5 rounded-full">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-600" />
                    <span className="text-slate-700 font-medium">{notification.lead_name}</span>
                  </div>
                </div>
                <Separator className="mt-4 bg-slate-100" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-3 gap-4">
      <NotificationCard 
        title="Today's Notifications" 
        notifications={today}
        icon={<Bell className="h-5 w-5 text-primary" />}
      />
      <NotificationCard 
        title="Tomorrow's Notifications" 
        notifications={tomorrow}
        icon={<Calendar className="h-5 w-5 text-primary" />}
      />
      <NotificationCard
        title="Other Notifications"
        notifications={other}
        icon={<Calendar className="h-5 w-5 text-primary" />}
      />
    </div>
  )
}

export default NotificationPage