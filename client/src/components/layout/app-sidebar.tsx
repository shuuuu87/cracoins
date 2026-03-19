import { LayoutDashboard, Trophy, Activity, User, ShieldAlert, LogOut, Coins, MessageSquare } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarImage } from "@/lib/avatars";
import { useUnreadActivities } from "@/hooks/use-unread-activities";
import { useUnreadMessageCount } from "@/hooks/use-messages";
import { getActivityBadgeColor } from "@/lib/activity-colors";

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount, primaryType, markAllAsRead } = useUnreadActivities();
  const { data: msgUnread } = useUnreadMessageCount();
  const unreadMsgCount = msgUnread?.count ?? 0;

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
    { title: "Activity Feed", url: "/activity", icon: Activity, badge: unreadCount > 0 ? unreadCount : null, badgeType: primaryType },
    { title: "Profile", url: "/profile", icon: User },
    { title: "Support", url: "/support", icon: MessageSquare, badge: unreadMsgCount > 0 ? unreadMsgCount : null, badgeType: 'support' as const },
  ];

  const colors = getActivityBadgeColor(primaryType);

  const handleActivityClick = () => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  const avatarSrc = user?.profileImageUrl || getAvatarImage(user?.avatar ?? "avatar1") || undefined;

  return (
    <Sidebar variant="sidebar" className="border-r border-border/60 bg-white dark:bg-slate-950">
      <SidebarContent>
        {/* Brand Header */}
        <div className="p-5 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
              <Coins className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground leading-tight">
                CraCoins
              </h1>
              <p className="text-xs text-muted-foreground font-medium">No-Spend Challenge</p>
            </div>
          </div>
        </div>

        {/* User Profile */}
        {user && (
          <div className="px-4 py-3 mx-3 mt-4 mb-2 bg-background rounded-xl flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage src={avatarSrc} alt={user.username} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden min-w-0">
              <span className="font-semibold text-sm truncate text-foreground">{user.username}</span>
              <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
            </div>
          </div>
        )}

        <SidebarGroup className="px-3 pt-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Menu</p>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {menuItems.map((item) => {
                const isActive = location === item.url;
                const isActivityFeed = item.url === "/activity";
                const isSupport = item.url === "/support";
                const itemBadge = item.badge;
                const badgeColor = isSupport
                  ? "bg-primary/10 text-primary"
                  : colors.bg;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={`rounded-xl h-10 font-medium transition-all relative group ${
                        isActive
                          ? 'bg-primary text-white shadow-sm hover:bg-primary/90'
                          : 'text-muted-foreground hover:bg-background hover:text-foreground'
                      }`}
                      onClick={() => {
                        if (isActivityFeed) handleActivityClick();
                      }}
                    >
                      <Link href={item.url} className="flex items-center gap-2 w-full">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {itemBadge && (
                          <div className={`ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColor}`}>
                            {!isSupport && <div className={`h-1.5 w-1.5 rounded-full ${colors.dot}`}></div>}
                            <span className={isActive ? "text-white" : "text-foreground"}>{itemBadge}</span>
                          </div>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {user?.role === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location === "/admin"}
                    tooltip="Admin Panel"
                    className={`rounded-xl h-10 font-medium transition-all ${
                      location === "/admin"
                        ? 'bg-destructive text-white shadow-sm'
                        : 'text-destructive/80 hover:bg-destructive/10 hover:text-destructive'
                    }`}
                  >
                    <Link href="/admin">
                      <ShieldAlert className="h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="rounded-xl h-10 text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-500 font-medium transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
