import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export function MainLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated, we just render the content (which is usually the Landing or Auth page)
  if (!user) {
    return <div className="min-h-screen bg-background text-foreground flex flex-col">{children}</div>;
  }

  return (
    <SidebarProvider style={style}>
      <div className="flex min-h-screen w-full bg-background overflow-hidden relative">
        {/* Abstract gaming background elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
        
        <AppSidebar />
        
        <div className="flex flex-col flex-1 z-10 w-full overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b border-border/40 bg-card/40 backdrop-blur-md sticky top-0 z-20">
            <SidebarTrigger />
            <div className="font-display font-semibold text-primary uppercase text-sm tracking-wider">
              No-Spend Protocol Active
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
