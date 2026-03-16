import { useEffect, useState } from 'react';
import { useActivities } from './use-activities';
import { Activity } from '@shared/schema';

export function useUnreadActivities() {
  const { data: activities = [] } = useActivities();
  const [unreadActivities, setUnreadActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const seenActivitiesKey = 'cracoins_seen_activity_ids';
    const stored = localStorage.getItem(seenActivitiesKey);
    const seenIds = new Set(stored ? JSON.parse(stored) : []);

    const unread = activities.filter(activity => !seenIds.has(activity.id));
    setUnreadActivities(unread);
  }, [activities]);

  const markAllAsRead = () => {
    const seenActivitiesKey = 'cracoins_seen_activity_ids';
    const seenIds = new Set(activities.map(a => a.id));
    localStorage.setItem(seenActivitiesKey, JSON.stringify(Array.from(seenIds)));
    setUnreadActivities([]);
  };

  const getPrimaryUnreadType = () => {
    if (unreadActivities.length === 0) return null;
    
    const typeOrder = ['announcement', 'disqualification', 'rejected', 'approved', 'join', 'submission', 'milestone', 'warning', 'reinstate', 'gain'];
    const types = new Set(unreadActivities.map(a => a.type.toLowerCase()));
    
    for (const type of typeOrder) {
      if (types.has(type)) return type;
    }
    
    return unreadActivities[0].type.toLowerCase();
  };

  const getUnreadCount = () => unreadActivities.length;

  return {
    unreadActivities,
    unreadCount: getUnreadCount(),
    primaryType: getPrimaryUnreadType(),
    markAllAsRead,
  };
}
