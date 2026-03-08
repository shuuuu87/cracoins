import { useActivities } from "@/hooks/use-activities";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Bell, ShieldAlert, Trophy, ArrowUpCircle } from "lucide-react";

export default function ActivityFeed() {
  const { data: activities, isLoading } = useActivities();

  const getIcon = (type: string) => {
    switch (type) {
      case 'join': return <Bell className="h-5 w-5 text-primary" />;
      case 'disqualify': return <ShieldAlert className="h-5 w-5 text-destructive" />;
      case 'gain': return <ArrowUpCircle className="h-5 w-5 text-green-500" />;
      case 'milestone': return <Trophy className="h-5 w-5 text-yellow-400" />;
      default: return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'join': return 'bg-primary/10 border-primary/20';
      case 'disqualify': return 'bg-destructive/10 border-destructive/20';
      case 'gain': return 'bg-green-500/10 border-green-500/20';
      case 'milestone': return 'bg-yellow-400/10 border-yellow-400/20';
      default: return 'bg-muted/30 border-border/50';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-foreground flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          Network Feed
        </h1>
        <p className="text-muted-foreground mt-1">Live updates from the protocol network.</p>
      </div>

      <div className="space-y-4 mt-8 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {isLoading ? (
          <div className="text-center p-8 text-muted-foreground">Intercepting transmissions...</div>
        ) : activities?.length === 0 ? (
          <div className="text-center p-12 text-muted-foreground">Network is silent.</div>
        ) : (
          activities?.map((act, idx) => (
            <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Timeline dot */}
              <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md ${getBgColor(act.type)} z-10 bg-background`}>
                {getIcon(act.type)}
              </div>
              
              {/* Content Card */}
              <Card className={`w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] glass-panel hover-elevate transition-all border-l-4 md:border-l-0 md:group-even:border-l-4 md:group-odd:border-r-4 ${
                act.type === 'disqualify' ? 'border-destructive/60' : 'border-primary/40'
              }`}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-display tracking-widest uppercase text-muted-foreground">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm md:text-base">{act.message}</p>
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
