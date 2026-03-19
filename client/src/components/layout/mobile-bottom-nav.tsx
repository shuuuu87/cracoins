import { LayoutDashboard, Trophy, Activity, User, MessageSquare, ShieldAlert } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadActivities } from "@/hooks/use-unread-activities";
import { useUnreadMessageCount } from "@/hooks/use-messages";
import { getActivityBadgeColor } from "@/lib/activity-colors";

export function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { unreadCount, primaryType, markAllAsRead } = useUnreadActivities();
  const { data: msgUnread } = useUnreadMessageCount();
  const unreadMsgCount = msgUnread?.count ?? 0;
  const colors = getActivityBadgeColor(primaryType);

  const baseItems = [
    { title: "Home", url: "/dashboard", icon: LayoutDashboard },
    { title: "Board", url: "/leaderboard", icon: Trophy },
    {
      title: "Activity",
      url: "/activity",
      icon: Activity,
      badge: unreadCount > 0 ? unreadCount : null,
      badgeDot: colors.dot,
      onTap: () => { if (unreadCount > 0) markAllAsRead(); },
    },
    {
      title: "Support",
      url: "/support",
      icon: MessageSquare,
      badge: unreadMsgCount > 0 ? unreadMsgCount : null,
      badgeDot: "bg-primary",
    },
    { title: "Profile", url: "/profile", icon: User },
  ];

  const adminItem = user?.role === "admin"
    ? { title: "Admin", url: "/admin", icon: ShieldAlert, isAdmin: true }
    : null;

  const items = adminItem ? [...baseItems, adminItem] : baseItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white dark:bg-slate-950 border-t border-border/60 shadow-[0_-1px_8px_rgba(0,0,0,0.08)]">
      <div className="flex items-stretch h-16">
        {items.map((item) => {
          const isActive = location === item.url;
          const isAdmin = 'isAdmin' in item && item.isAdmin;

          return (
            <Link
              key={item.url}
              href={item.url}
              onClick={'onTap' in item ? item.onTap : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 relative transition-colors
                ${isAdmin
                  ? isActive
                    ? "text-destructive"
                    : "text-destructive/50 active:text-destructive"
                  : isActive
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground"
                }`}
              data-testid={`mobile-nav-${item.url.replace("/", "")}`}
            >
              <div className="relative">
                <item.icon className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : ""}`} />
                {'badge' in item && item.badge ? (
                  <span className={`absolute -top-1.5 -right-2 min-w-[16px] h-4 px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center text-white
                    ${isAdmin ? "bg-destructive" : "bg-primary"}`}>
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] font-medium leading-tight ${isActive ? "font-semibold" : ""}`}>
                {item.title}
              </span>
              {isActive && (
                <span className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full ${isAdmin ? "bg-destructive" : "bg-primary"}`} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
