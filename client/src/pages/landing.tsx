import { Link, useLocation } from "wouter";
import { CountdownTimer } from "@/components/countdown-timer";
import { Button } from "@/components/ui/button";
import { Shield, Target, TrendingUp, Coins } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Landing() {
  const [_, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  const challengeStart = new Date("2026-03-18T10:12:00Z");
  const isStarted = new Date() > challengeStart;

  if (isLoading) return null;
  if (user) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      {/* Header */}
      <header className="py-4 px-8 flex justify-between items-center bg-white border-b border-border/60 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
            <Coins className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-display font-bold text-foreground">CraCoins</span>
        </div>
        <Button asChild className="h-9 px-5 rounded-xl font-semibold">
          <Link href="/auth">Sign In</Link>
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-20">
        {/* Hero */}
        <div className="text-center max-w-3xl mb-16 space-y-5">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold text-sm px-4 py-1.5 rounded-full mb-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Mar 18, 2026
          </div>
          <h2 className="text-5xl md:text-6xl font-display font-bold leading-tight text-foreground">
            The 1-Day<br />
            <span className="text-primary">No-Spend Challenge</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Track your Mech Arena A-Coins and Credits. Compete on leaderboards. Prove your discipline.
          </p>
        </div>

        {/* Countdown */}
        <div className="w-full max-w-3xl mb-14">
          <CountdownTimer
            targetDate={isStarted ? new Date("2026-03-18T11:12:00Z") : challengeStart}
            label={isStarted ? "Challenge Ends In" : "Challenge Starts In"}
          />
        </div>

        {!isStarted ? (
          <Button asChild size="lg" className="h-13 px-12 text-base font-bold rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105">
            <Link href="/auth">Join the Challenge</Link>
          </Button>
        ) : (
          <div className="text-accent font-semibold bg-accent/10 border border-accent/30 px-6 py-3 rounded-xl">
            Registration Closed — Protocol is Active
          </div>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-24">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center text-center shadow-sm border border-border/60 hover-elevate">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-display font-semibold mb-2 text-foreground">Zero A-Coins</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Strict zero A-Coin spending policy. Any expenditure means immediate disqualification.</p>
          </div>
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center text-center shadow-sm border border-border/60 hover-elevate">
            <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
              <Target className="h-7 w-7 text-accent" />
            </div>
            <h3 className="text-lg font-display font-semibold mb-2 text-foreground">Credit Limit</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Maximum 4,000 credits spent daily. Exceed this and an official warning is issued.</p>
          </div>
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center text-center shadow-sm border border-border/60 hover-elevate">
            <div className="h-14 w-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-5">
              <TrendingUp className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-lg font-display font-semibold mb-2 text-foreground">Daily Proof</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Submit resource screenshots daily. Admins verify every submission for full integrity.</p>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border/60 bg-white">
        © 2026 CraCoins. Mech Arena No-Spend Challenge Tracker.
      </footer>
    </div>
  );
}
