import { useEffect, useState } from "react";
import { differenceInSeconds } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

interface CountdownProps {
  targetDate: Date;
  label: string;
}

export function CountdownTimer({ targetDate, label }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isPassed, setIsPassed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = differenceInSeconds(targetDate, now);

      if (diff <= 0) {
        setIsPassed(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
      } else {
        setIsPassed(false);
        setTimeLeft({
          days: Math.floor(diff / (3600 * 24)),
          hours: Math.floor((diff % (3600 * 24)) / 3600),
          minutes: Math.floor((diff % 3600) / 60),
          seconds: diff % 60,
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (isPassed) {
    return (
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-display text-primary uppercase">{label} REACHED</h3>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel overflow-hidden border-t-primary/30">
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider text-center">{label}</h3>
        <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
          <div className="flex flex-col">
            <span className="text-3xl sm:text-5xl font-display font-bold text-primary text-shadow-glow">
              {String(timeLeft.days).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted-foreground mt-1 uppercase">Days</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl sm:text-5xl font-display font-bold text-primary text-shadow-glow">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted-foreground mt-1 uppercase">Hours</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl sm:text-5xl font-display font-bold text-primary text-shadow-glow">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted-foreground mt-1 uppercase">Mins</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl sm:text-5xl font-display font-bold text-primary text-shadow-glow">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted-foreground mt-1 uppercase">Secs</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
