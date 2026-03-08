import { Link, useLocation } from "wouter";
import { CountdownTimer } from "@/components/countdown-timer";
import { Button } from "@/components/ui/button";
import { Shield, Target, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Landing() {
  const [_, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  
  const challengeStart = new Date("2026-04-24T00:00:00Z");
  const isStarted = new Date() > challengeStart;

  if (isLoading) return null;
  if (user) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen w-full relative">
      {/* Abstract Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none z-0" />
      
      <header className="py-6 px-8 flex justify-between items-center z-10 border-b border-white/5 bg-background/50 backdrop-blur-sm">
        <h1 className="text-2xl font-display font-bold text-primary uppercase tracking-widest text-shadow-glow">
          Mech Tracker
        </h1>
        <Button asChild variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
          <Link href="/auth">LOGIN</Link>
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-16 z-10">
        <div className="text-center max-w-3xl mb-16 space-y-6">
          <h2 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tight leading-tight">
            The 4-Month <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">No-Spend Protocol</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground font-body max-w-2xl mx-auto">
            Commit to the ultimate resource management challenge. Track your A-Coins and Credits, compete on the leaderboards, and prove your discipline in Mech Arena.
          </p>
        </div>

        <div className="w-full max-w-4xl mb-16">
          <CountdownTimer 
            targetDate={isStarted ? new Date("2026-08-24T00:00:00Z") : challengeStart} 
            label={isStarted ? "Challenge Ends In" : "Challenge Starts In"} 
          />
        </div>

        {!isStarted ? (
          <Button asChild size="lg" className="h-14 px-12 text-lg font-bold font-display tracking-widest shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)] hover:scale-105 transition-all">
            <Link href="/auth">INITIALIZE REGISTRATION</Link>
          </Button>
        ) : (
          <div className="text-accent font-display font-semibold uppercase tracking-widest border border-accent/30 bg-accent/10 px-6 py-3 rounded-lg">
            Registration Closed. Protocol is active.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mt-24">
          <div className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-display mb-3">Zero A-Coins</h3>
            <p className="text-muted-foreground">Strict zero A-Coin spending policy. Any A-Coin expenditure results in immediate disqualification.</p>
          </div>
          <div className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mb-6">
              <Target className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-display mb-3">Credit Limit</h3>
            <p className="text-muted-foreground">Maximum of 4,000 credits can be spent daily. Exceeding this limit will trigger an official warning.</p>
          </div>
          <div className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-chart-1/10 flex items-center justify-center mb-6">
              <TrendingUp className="h-8 w-8 text-chart-1" />
            </div>
            <h3 className="text-xl font-display mb-3">Daily Proof</h3>
            <p className="text-muted-foreground">Submit your resource screenshots daily. Admins verify submissions to ensure absolute integrity.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
