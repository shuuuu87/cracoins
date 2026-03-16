import { LayoutDashboard, Trophy, Activity, User, ShieldAlert, LogOut, Coins } from "lucide-react";
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

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
    { title: "Activity Feed", url: "/activity", icon: Activity },
    { title: "Profile", url: "/profile", icon: User },
  ];

  return (
    <Sidebar variant="sidebar" className="border-r border-border/60 bg-white">
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
              <AvatarImage src={getAvatarImage(user.avatar) || undefined} alt={user.username} />
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
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={`rounded-xl h-10 font-medium transition-all ${
                        isActive
                          ? 'bg-primary text-white shadow-sm hover:bg-primary/90'
                          : 'text-muted-foreground hover:bg-background hover:text-foreground'
                      }`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
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
              className="rounded-xl h-10 text-muted-foreground hover:bg-red-50 hover:text-red-500 font-medium transition-all"
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
