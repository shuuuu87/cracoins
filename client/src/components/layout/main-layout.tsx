import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { useAuth } from "@/hooks/use-auth";
import { useProtocol } from "@/hooks/use-protocol";
import { Loader2, Coins } from "lucide-react";
import ProtocolEnded from "@/pages/protocol-ended";

export function MainLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const { protocolEnded } = useProtocol();

  const style = {
    "--sidebar-width": "15rem",
    "--sidebar-width-icon": "3.5rem",
  } as React.CSSProperties;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center shadow-md">
            <Coins className="h-6 w-6 text-white" />
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="min-h-screen bg-background text-foreground flex flex-col">{children}</div>;
  }

  if (protocolEnded) {
    return (
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        <ProtocolEnded />
      </div>
    );
  }

  return (
    <SidebarProvider style={style}>
      <div className="flex min-h-screen w-full bg-background overflow-hidden">
        {/* Sidebar — desktop only */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex flex-col flex-1 w-full overflow-hidden">
          <header className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b border-border/60 bg-white dark:bg-slate-950 sticky top-0 z-20 shadow-sm">
            {/* Sidebar toggle — desktop only */}
            <div className="hidden md:block">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            </div>

            {/* App brand — mobile only */}
            <div className="flex md:hidden items-center gap-2">
              <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
                <Coins className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-display font-bold text-foreground">CraCoins</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs md:text-sm font-medium text-muted-foreground">
                Challenge Active
              </span>
            </div>
          </header>

          {/* Main content — extra bottom padding on mobile for the bottom nav */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Bottom navigation — mobile only */}
      <MobileBottomNav />
    </SidebarProvider>
  );
}
