import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useMyLogs, useSubmitLog } from "@/hooks/use-logs";
import { CountdownTimer } from "@/components/countdown-timer";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Upload, CheckCircle2, XCircle, Clock, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getTimezoneForCountry } from "@/lib/timezones";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: logs, isLoading: loadingLogs } = useMyLogs();
  const submitLog = useSubmitLog();
  const { toast } = useToast();

  const [aCoins, setACoins] = useState("");
  const [credits, setCredits] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const challengeStart = new Date("2026-04-24T00:00:00Z");
  const challengeEnd = new Date("2026-08-24T00:00:00Z");
  const now = new Date();
  const protocolStarted = now >= challengeStart;
  const countdownTarget = protocolStarted ? challengeEnd : challengeStart;
  const countdownLabel = protocolStarted ? "Protocol Ends In" : "Protocol Starts In";

  // Helper: Get today's date in user's timezone
  const getTodayInUserTimezone = useMemo(() => {
    const timezone = getTimezoneForCountry(user?.country);
    
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now);
  }, [user?.country, now]);

  // Helper: Get protocol start time in user's local timezone
  const getProtocolStartTimeInUserTimezone = useMemo(() => {
    const timezone = getTimezoneForCountry(user?.country);
    
    const utcFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    
    const localFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    
    const utcTime = utcFormatter.format(challengeStart);
    const localTime = localFormatter.format(challengeStart);
    
    return `${utcTime} UTC (Your time: ${localTime})`;
  }, [user?.country, challengeStart]);

  // Check submission status for today (in their timezone) - get the LATEST submission if multiple exist
  const todaySubmission = useMemo(() => {
    if (!logs) return undefined;
    // Filter all submissions for today, then get the last one
    const todayLogs = logs.filter(log => log.date === getTodayInUserTimezone);
    return todayLogs.length > 0 ? todayLogs[todayLogs.length - 1] : undefined;
  }, [logs, getTodayInUserTimezone]);

  // Block submission only if there's a pending or approved submission today
  // Allow resubmission if the only submission today was rejected
  const submittedToday = useMemo(() => {
    return todaySubmission && todaySubmission.status !== 'rejected';
  }, [todaySubmission]);

  const rejectedToday = useMemo(() => {
    return todaySubmission?.status === 'rejected';
  }, [todaySubmission]);

  // Calculate next reset time (midnight in user's timezone)
  const nextResetTime = useMemo(() => {
    if (!user?.timezone) return new Date();
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: user.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const tomorrowInTz = formatter.format(tomorrow);
    const [year, month, day] = tomorrowInTz.split('-');
    
    return new Date(`${year}-${month}-${day}T00:00:00Z`);
  }, [user?.timezone, now]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !aCoins || !credits) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("date", new Date().toISOString().split('T')[0]);
    formData.append("aCoins", aCoins);
    formData.append("credits", credits);
    formData.append("screenshot", file);

    try {
      await submitLog.mutateAsync(formData);
      // Clear form immediately for visual feedback
      setACoins("");
      setCredits("");
      setFile(null);
      toast({ title: "Submission Received", description: "Awaiting admin verification. Form locked until 12:00 AM." });
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message, variant: "destructive" });
    }
  };

  if (!user) return null;

  const totalGainedACoins = logs?.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.aCoinChange, 0) || 0;
  const totalGainedCredits = logs?.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.creditsChange, 0) || 0;

  // Chart data prep: Show 7-day weekly cycle
  const logsByDate = new Map<string, { aCoins: number; credits: number }>();
  
  // Group submitted logs by date
  logs?.forEach(log => {
    const date = log.date;
    if (!logsByDate.has(date)) {
      logsByDate.set(date, { aCoins: 0, credits: 0 });
    }
    const entry = logsByDate.get(date)!;
    entry.aCoins = log.aCoins;
    entry.credits = log.credits;
  });
  
  // Build chart data showing weekly progression
  const sortedDates = Array.from(logsByDate.keys()).sort();
  const chartData: Array<{date: string; day: string; aCoins: number; credits: number}> = [];
  
  if (sortedDates.length > 0) {
    const startDate = new Date(sortedDates[0]);
    const endDate = new Date(sortedDates[sortedDates.length - 1]);
    let currentDate = new Date(startDate);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let weekCounter = 0;
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();
      const dayName = dayNames[dayOfWeek];
      const dayOfMonth = currentDate.getDate();
      
      const entry = logsByDate.get(dateStr) || { aCoins: 0, credits: 0 };
      chartData.push({
        date: dateStr,
        day: `${dayName} ${dayOfMonth}`,
        aCoins: entry.aCoins,
        credits: entry.credits,
      });
      
      if (dayOfWeek === 6) weekCounter++; // Reset counter on Sunday
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // Prediction calculation based on actual dates
  const approvedLogs = logs?.filter(l => l.status === 'approved') || [];
  
  // Calculate days passed and remaining using already-defined variables
  const daysPassed = Math.max(1, Math.floor((now.getTime() - challengeStart.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, Math.floor((challengeEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Average gain per day based on approved logs
  const avgACoinsPerDay = approvedLogs.length > 0 ? totalGainedACoins / approvedLogs.length : 0;
  const avgCreditsPerDay = approvedLogs.length > 0 ? totalGainedCredits / approvedLogs.length : 0;
  
  // Predict final values based on trajectory until August 24, 2026
  const predictedACoins = user.startACoins + totalGainedACoins + (avgACoinsPerDay * daysRemaining);
  const predictedCredits = user.startCredits + totalGainedCredits + (avgCreditsPerDay * daysRemaining);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-primary text-shadow-glow">Command Center</h1>
          <p className="text-muted-foreground mt-1">Welcome back, Pilot {user.username}.</p>
        </div>
      </div>

      {user.isDisqualified && (
        <Alert variant="destructive" className="border-2 glass-panel border-destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-display uppercase tracking-widest">PROTOCOL BREACH DETECTED</AlertTitle>
          <AlertDescription>
            You have been disqualified from the challenge due to a violation of the spending rules.
          </AlertDescription>
        </Alert>
      )}

      {!protocolStarted && (
        <Alert variant="destructive" className="border-2 glass-panel border-destructive mb-6">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-display uppercase tracking-widest">PROTOCOL LOCKED</AlertTitle>
          <AlertDescription>
            All dashboard sections are locked until the protocol starts on {getProtocolStartTimeInUserTimezone}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all">
        {/* Stats Column */}
        <div className="space-y-6">
          <CountdownTimer 
            targetDate={countdownTarget} 
            label={countdownLabel}
            passedLabel={protocolStarted ? "Protocol End" : "Protocol Start"}
          />
          
          <Card className={`glass-panel border-accent/20 transition-all ${!protocolStarted ? 'blur-sm opacity-40 pointer-events-none' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-widest">Net Approved Gains</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end border-b border-border/50 pb-4 mb-4">
                <span className="text-lg font-semibold text-accent">A-Coins</span>
                <span className="text-3xl font-display font-bold text-accent">+{totalGainedACoins}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-lg font-semibold text-primary">Credits</span>
                <span className="text-3xl font-display font-bold text-primary">+{totalGainedCredits}</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`glass-panel border-muted ${!protocolStarted ? 'blur-sm' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-widest">End Prediction (Aug 24)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">A-Coins Projected</p>
                <div className="text-3xl font-display font-bold text-accent">
                  {Math.round(Math.max(user.startACoins, predictedACoins)).toLocaleString()}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Credits Projected</p>
                <div className="text-3xl font-display font-bold text-primary">
                  {Math.round(Math.max(user.startCredits, predictedCredits)).toLocaleString()}
                </div>
              </div>
              <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
                {daysRemaining} days remaining • Avg {Math.round(avgACoinsPerDay)}/day
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graph & Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className={`glass-panel overflow-hidden border-border/50 transition-all ${!protocolStarted ? 'blur-sm opacity-40 pointer-events-none' : ''}`}>
            <CardHeader>
              <CardTitle className="font-display tracking-widest uppercase">Resource Trajectory</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No submissions yet. Submit your first daily report to see trajectory.
                </div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                      <YAxis yAxisId="left" stroke="hsl(var(--primary))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--accent))" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        itemStyle={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                      <Line yAxisId="left" type="monotone" dataKey="aCoins" name="A-Coins" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--background))', strokeWidth: 2 }} activeDot={{ r: 6, fill: 'hsl(var(--accent))' }} />
                      <Line yAxisId="right" type="monotone" dataKey="credits" name="Credits" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--background))', strokeWidth: 2 }} activeDot={{ r: 6, fill: 'hsl(var(--primary))' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`glass-panel border-primary/30 relative overflow-hidden transition-all ${submittedToday ? 'opacity-60' : ''} ${!protocolStarted ? 'blur-sm opacity-40 pointer-events-none' : ''}`}>
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            {submittedToday && (
              <div className="absolute inset-0 bg-background/40 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10">
                <Lock className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm font-semibold text-center px-4">
                  Daily submission limit reached
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Available at 12:00 AM {user?.timezone}
                </p>
              </div>
            )}
            <CardHeader>
              <CardTitle className="font-display tracking-widest uppercase text-primary">Daily Submission</CardTitle>
              <CardDescription>Upload screenshot proof of your current resources.</CardDescription>
              {rejectedToday && (
                <Alert className="mt-4 border-destructive/50 bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertTitle className="text-destructive">Submission Rejected - Last Chance</AlertTitle>
                  <AlertDescription>Your previous submission was rejected. You have one more attempt to submit for today.</AlertDescription>
                </Alert>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-primary">Current A-Coins</Label>
                    <Input 
                      type="number" 
                      min="0" 
                      value={aCoins} 
                      onChange={(e) => setACoins(e.target.value)} 
                      className="bg-background/50 border-primary/20 focus-visible:ring-primary"
                      placeholder="e.g. 5000"
                      disabled={user.isDisqualified || submittedToday}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-accent">Current Credits</Label>
                    <Input 
                      type="number" 
                      min="0" 
                      value={credits} 
                      onChange={(e) => setCredits(e.target.value)} 
                      className="bg-background/50 border-accent/20 focus-visible:ring-accent"
                      placeholder="e.g. 150000"
                      disabled={user.isDisqualified || submittedToday}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Screenshot Proof</Label>
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${submittedToday ? 'border-muted-foreground/10 bg-muted/5' : 'border-muted-foreground/30 hover:bg-muted/20'}`}>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden" 
                      id="file-upload"
                      disabled={user.isDisqualified || submittedToday}
                    />
                    <Label htmlFor="file-upload" className={`flex flex-col items-center justify-center gap-2 ${submittedToday ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      <Upload className={`h-8 w-8 ${submittedToday ? 'text-muted-foreground/40' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium ${submittedToday ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>
                        {file ? file.name : "Click to select or drag and drop image"}
                      </span>
                    </Label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 font-display tracking-widest text-base shadow-[0_0_15px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_25px_hsl(var(--primary)/0.5)] transition-all mt-4" 
                  disabled={submitLog.isPending || user.isDisqualified || submittedToday}
                >
                  {submittedToday ? "SUBMISSION COMPLETE TODAY" : submitLog.isPending ? "TRANSMITTING..." : "SUBMIT RESOURCES"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Submissions Log */}
      <div className={`transition-all ${!protocolStarted ? 'blur-sm opacity-40 pointer-events-none' : ''}`}>
        <h2 className="text-xl font-display uppercase tracking-widest text-primary mt-12 mb-4">Submission History</h2>
        <div className="space-y-3">
        {loadingLogs ? (
          <div className="text-center p-8 text-muted-foreground">Loading logs...</div>
        ) : logs?.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-border/50 rounded-lg text-muted-foreground">No submissions yet.</div>
        ) : (
          logs?.slice(0, 20).map((log) => (
            <div key={log.id} className="flex items-center justify-between p-4 glass-panel rounded-lg hover-elevate border-l-4" style={{
              borderLeftColor: log.status === 'approved' ? 'hsl(var(--primary))' : log.status === 'rejected' ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))'
            }}>
              <div className="flex items-center gap-4">
                {log.status === 'approved' && <CheckCircle2 className="h-5 w-5 text-primary" />}
                {log.status === 'rejected' && <XCircle className="h-5 w-5 text-destructive" />}
                {log.status === 'pending' && <Clock className="h-5 w-5 text-muted-foreground" />}
                <div>
                  <div className="font-semibold">{new Date(log.date).toLocaleDateString()}</div>
                  <div className="text-xs text-muted-foreground uppercase">{log.status}</div>
                </div>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <div className="text-xs text-muted-foreground uppercase">A-Coins</div>
                  <div className="font-display font-bold">{log.aCoins}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase">Credits</div>
                  <div className="font-display font-bold">{log.credits}</div>
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  );
}
