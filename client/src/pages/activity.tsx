import { useActivities } from "@/hooks/use-activities";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity, Bell, ShieldAlert, Trophy,
  ArrowUpCircle, CheckCircle2, XCircle, AlertTriangle, Zap
} from "lucide-react";

export default function ActivityFeed() {
  const { data: activities, isLoading } = useActivities();

  const getIcon = (type: string) => {
    switch (type) {
      case 'join':           return <Bell className="h-5 w-5 text-primary" />;
      case 'submission':     return <Zap className="h-5 w-5 text-accent" />;
      case 'approved':       return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'rejected':       return <XCircle className="h-5 w-5 text-red-400" />;
      case 'disqualify':
      case 'disqualification': return <ShieldAlert className="h-5 w-5 text-destructive" />;
      case 'warning':        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'milestone':      return <Trophy className="h-5 w-5 text-yellow-400" />;
      case 'reinstate':      return <ArrowUpCircle className="h-5 w-5 text-blue-500" />;
      case 'announcement':   return <Activity className="h-5 w-5 text-purple-500" />;
      case 'gain':           return <ArrowUpCircle className="h-5 w-5 text-green-500" />;
      default:               return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'join':           return 'bg-primary/10 border-primary/20';
      case 'submission':     return 'bg-accent/10 border-accent/20';
      case 'approved':       return 'bg-green-500/10 border-green-500/20';
      case 'rejected':       return 'bg-red-400/10 border-red-400/20';
      case 'disqualify':
      case 'disqualification': return 'bg-destructive/10 border-destructive/20';
      case 'warning':        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'milestone':      return 'bg-yellow-400/10 border-yellow-400/20';
      case 'reinstate':      return 'bg-blue-500/10 border-blue-500/20';
      case 'announcement':   return 'bg-purple-500/10 border-purple-500/20';
      case 'gain':           return 'bg-green-500/10 border-green-500/20';
      default:               return 'bg-muted/30 border-border/50';
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'disqualify':
      case 'disqualification': return 'border-destructive/60';
      case 'rejected':       return 'border-red-400/50';
      case 'approved':       return 'border-green-500/50';
      case 'milestone':      return 'border-yellow-400/50';
      case 'join':           return 'border-primary/50';
      case 'submission':     return 'border-accent/40';
      case 'warning':        return 'border-yellow-500/50';
      case 'reinstate':      return 'border-blue-500/50';
      case 'announcement':   return 'border-purple-500/50';
      default:               return 'border-primary/40';
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case 'join':           return 'NEW PLAYER';
      case 'submission':     return 'DAILY REPORT';
      case 'approved':       return 'APPROVED';
      case 'rejected':       return 'REJECTED';
      case 'disqualify':
      case 'disqualification': return 'DISQUALIFIED';
      case 'warning':        return 'WARNING';
      case 'milestone':      return 'MILESTONE';
      case 'reinstate':      return 'REINSTATED';
      case 'announcement':   return 'ANNOUNCEMENT';
      default:               return 'EVENT';
    }
  };

  const getLabelColor = (type: string) => {
    switch (type) {
      case 'join':           return 'text-primary';
      case 'submission':     return 'text-accent';
      case 'approved':       return 'text-green-500';
      case 'rejected':       return 'text-red-400';
      case 'disqualify':
      case 'disqualification': return 'text-destructive';
      case 'warning':        return 'text-yellow-500';
      case 'milestone':      return 'text-yellow-400';
      case 'reinstate':      return 'text-blue-500';
      case 'announcement':   return 'text-purple-500';
      default:               return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center">
            <Activity className="h-5 w-5 text-white" />
          </div>
          Activity Feed
        </h1>
        <p className="text-muted-foreground mt-1">Live updates from the CraCoins network.</p>
      </div>

      <div className="space-y-4 mt-8 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {isLoading ? (
          <div className="text-center p-8 text-muted-foreground">Intercepting transmissions...</div>
        ) : activities?.length === 0 ? (
          <div className="text-center p-12 text-muted-foreground">Network is silent.</div>
        ) : (
          activities?.map((act) => (
            <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Timeline dot */}
              <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md ${getBgColor(act.type)} z-10 bg-background`}>
                {getIcon(act.type)}
              </div>

              {/* Content Card */}
              <Card className={`w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] glass-panel hover-elevate transition-all border-l-4 md:border-l-0 md:group-even:border-l-4 md:group-odd:border-r-4 ${getBorderColor(act.type)}`}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-display tracking-widest uppercase font-semibold ${getLabelColor(act.type)}`}>
                      {getLabel(act.type)}
                    </span>
                    <span className="text-xs text-muted-foreground">
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
