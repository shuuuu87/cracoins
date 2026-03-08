import { Home, LayoutDashboard, Trophy, Activity, User, ShieldAlert, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
    { title: "Activity Feed", url: "/activity", icon: Activity },
    { title: "Profile", url: "/profile", icon: User },
  ];

  return (
    <Sidebar variant="sidebar" className="border-r border-border/50">
      <SidebarContent>
        <div className="p-6">
          <h1 className="text-2xl font-display font-bold text-primary text-shadow-glow tracking-tight uppercase">
            Mech Tracker
          </h1>
        </div>

        {user && (
          <div className="px-6 py-4 flex items-center gap-3 border-b border-border/50">
            <Avatar className="h-10 w-10 border border-primary/50">
              <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.avatar}`} />
              <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-sm truncate">{user.username}</span>
              <span className="text-xs text-muted-foreground uppercase">{user.role}</span>
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="uppercase text-xs tracking-wider">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url} className="hover-elevate">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {user?.role === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === "/admin"}
                    className="text-accent hover:text-accent-foreground"
                  >
                    <Link href="/admin" className="hover-elevate">
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
      
      <SidebarFooter className="p-4 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />
              <span>Disconnect</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
