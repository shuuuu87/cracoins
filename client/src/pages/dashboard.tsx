import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useMyLogs, useSubmitLog } from "@/hooks/use-logs";
import { CountdownTimer } from "@/components/countdown-timer";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Upload, CheckCircle2, XCircle, Clock, Lock, Flame, TrendingUp, Calendar } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getTimezoneForCountry } from "@/lib/timezones";
import { WelcomeModal } from "@/components/welcome-modal";
import { useProtocol } from "@/hooks/use-protocol";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: logs, isLoading: loadingLogs } = useMyLogs();
  const submitLog = useSubmitLog();
  const { toast } = useToast();

  const [aCoins, setACoins] = useState("");
  const [credits, setCredits] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (user && !user.seenWelcome) {
      setShowWelcome(true);
    }
  }, [user]);

  const { challengeStart, challengeEnd, protocolStarted, now } = useProtocol();
  const countdownTarget = protocolStarted ? challengeEnd : challengeStart;
  const countdownLabel = protocolStarted ? "Protocol Ends In" : "Protocol Starts In";

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

  const getProtocolStartTimeInUserTimezone = useMemo(() => {
    const timezone = getTimezoneForCountry(user?.country);
    const utcFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    });
    const localFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    });
    return `${utcFormatter.format(challengeStart)} UTC (Your time: ${localFormatter.format(challengeStart)})`;
  }, [user?.country, challengeStart]);

  const todaySubmission = useMemo(() => {
    if (!logs) return undefined;
    const todayLogs = logs.filter(log => log.date === getTodayInUserTimezone);
    return todayLogs.length > 0 ? todayLogs[todayLogs.length - 1] : undefined;
  }, [logs, getTodayInUserTimezone]);

  const submittedToday = useMemo(() => todaySubmission && todaySubmission.status !== 'rejected', [todaySubmission]);
  const rejectedToday = useMemo(() => todaySubmission?.status === 'rejected', [todaySubmission]);

  const nextResetTime = useMemo(() => {
    const timezone = getTimezoneForCountry(user?.country);
    const tomorrow = new Date(getTodayInUserTimezone);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).format(new Date(getTodayInUserTimezone + 'T00:00:00'));
  }, [user?.country, getTodayInUserTimezone]);

  const approvedLogs = useMemo(() => {
    return (logs?.filter(l => l.status === 'approved') || []).sort((a, b) => a.date.localeCompare(b.date));
  }, [logs]);

  const totalGainedACoins = useMemo(() => approvedLogs.reduce((sum, l) => sum + l.aCoinChange, 0), [approvedLogs]);
  const totalGainedCredits = useMemo(() => approvedLogs.reduce((sum, l) => sum + l.creditsChange, 0), [approvedLogs]);

  // ── Streak calculation ──────────────────────────────────────────────────────
  const { currentStreak, longestStreak } = useMemo(() => {
    const approvedDates = new Set(approvedLogs.map(l => l.date));
    let current = 0;
    let longest = 0;

    // Build consecutive streak backward from today
    const todayDate = new Date(getTodayInUserTimezone + 'T12:00:00Z');
    let checking = new Date(todayDate);

    // If today not yet approved, still count from yesterday so streak doesn't break mid-day
    const todayStr = getTodayInUserTimezone;
    if (!approvedDates.has(todayStr)) {
      checking.setDate(checking.getDate() - 1);
    }

    while (true) {
      const dateStr = checking.toISOString().split('T')[0];
      if (approvedDates.has(dateStr)) {
        current++;
        checking.setDate(checking.getDate() - 1);
      } else {
        break;
      }
    }

    // Longest streak
    const allDates = Array.from(approvedDates).sort();
    let runLen = 0;
    for (let i = 0; i < allDates.length; i++) {
      if (i === 0) {
        runLen = 1;
      } else {
        const prev = new Date(allDates[i - 1] + 'T12:00:00Z');
        const curr = new Date(allDates[i] + 'T12:00:00Z');
        const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
        runLen = diff === 1 ? runLen + 1 : 1;
      }
      longest = Math.max(longest, runLen);
    }

    return { currentStreak: current, longestStreak: longest };
  }, [approvedLogs, getTodayInUserTimezone]);

  // ── Cumulative gains chart ─────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (approvedLogs.length === 0) return [];
    let runningAC = 0;
    let runningCR = 0;
    const points: Array<{ day: string; acGain: number; crGain: number }> = [];

    approvedLogs.forEach((log, i) => {
      runningAC += log.aCoinChange;
      runningCR += log.creditsChange;
      const d = new Date(log.date + 'T12:00:00Z');
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      points.push({ day: label, acGain: runningAC, crGain: runningCR });
    });

    return points;
  }, [approvedLogs]);

  // ── Prediction ─────────────────────────────────────────────────────────────
  const daysPassed = Math.max(1, Math.floor((now.getTime() - challengeStart.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, Math.floor((challengeEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const avgACoinsPerDay = approvedLogs.length > 0 ? totalGainedACoins / approvedLogs.length : 0;
  const avgCreditsPerDay = approvedLogs.length > 0 ? totalGainedCredits / approvedLogs.length : 0;
  const predictedACoins = (user?.startACoins ?? 0) + totalGainedACoins + (avgACoinsPerDay * daysRemaining);
  const predictedCredits = (user?.startCredits ?? 0) + totalGainedCredits + (avgCreditsPerDay * daysRemaining);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !aCoins || !credits) {
      toast({ title: "Missing Fields", description: "Fill in all fields and attach a screenshot.", variant: "destructive" });
      return;
    }
    const formData = new FormData();
    formData.append('screenshot', file);
    formData.append('aCoins', aCoins);
    formData.append('credits', credits);
    try {
      await submitLog.mutateAsync(formData);
      setACoins(""); setCredits(""); setFile(null);
      toast({ title: "Submission Received", description: "Awaiting admin verification. Form locked until 12:00 AM." });
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleWelcomeClose = async () => {
    setShowWelcome(false);
    try {
      await fetch('/api/users/mark-welcome-seen', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Failed to mark welcome as seen:', err);
    }
  };

  if (!user) return null;

  const streakColor = currentStreak >= 7 ? 'text-orange-400' : currentStreak >= 3 ? 'text-yellow-500' : 'text-muted-foreground';
  const streakBorder = currentStreak >= 7 ? 'border-orange-400/30 bg-orange-400/5' : currentStreak >= 3 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-border/40';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg px-4 py-3 text-xs shadow-lg">
        <div className="text-muted-foreground mb-1.5 uppercase tracking-wider font-display">{label}</div>
        <div className="text-accent font-bold">+{payload[0]?.value?.toLocaleString()} AC gained</div>
        <div className="text-primary font-bold">+{payload[1]?.value?.toLocaleString()} CR gained</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <WelcomeModal open={showWelcome} onClose={handleWelcomeClose} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, <span className="font-semibold text-primary">{user.username}</span>.</p>
        </div>
      </div>

      {user.isDisqualified && (
        <Alert variant="destructive" className="border-2 glass-panel border-destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-display font-bold">Challenge Violation Detected</AlertTitle>
          <AlertDescription>You have been disqualified from the challenge due to a violation of the spending rules.</AlertDescription>
        </Alert>
      )}

      {!protocolStarted && (
        <Alert variant="destructive" className="border-2 glass-panel border-destructive mb-6">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-display font-bold">Challenge Not Started Yet</AlertTitle>
          <AlertDescription>All dashboard sections are locked until the protocol starts on {getProtocolStartTimeInUserTimezone}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all">
        {/* ── Stats Column ── */}
        <div className="space-y-4">
          <CountdownTimer
            targetDate={countdownTarget}
            label={countdownLabel}
            passedLabel={protocolStarted ? "Protocol End" : "Protocol Start"}
          />

          {/* Streak Card */}
          <Card className={`glass-panel border transition-all ${streakBorder} ${!protocolStarted ? 'blur-sm opacity-40 pointer-events-none' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className={`h-3.5 w-3.5 ${streakColor}`} /> Current Streak
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Best: <span className="font-bold text-foreground ml-0.5">{longestStreak}d</span>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className={`text-5xl font-display font-bold leading-none ${streakColor}`}>{currentStreak}</span>
                <span className="text-muted-foreground text-sm mb-1">day{currentStreak !== 1 ? 's' : ''} in a row</span>
              </div>
              <div className="mt-3 flex gap-1">
                {Array.from({ length: Math.min(14, Math.max(7, currentStreak + 2)) }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full transition-all ${
                      i < currentStreak
                        ? currentStreak >= 7 ? 'bg-orange-400' : currentStreak >= 3 ? 'bg-yellow-500' : 'bg-primary'
                        : 'bg-border/50'
                    }`}
                  />
                ))}
              </div>
              {currentStreak === 0 && (
                <p className="text-xs text-muted-foreground mt-2">Submit and get approved to start your streak.</p>
              )}
            </CardContent>
          </Card>

          {/* Net Gains */}
          <Card className={`glass-panel border-accent/20 transition-all ${!protocolStarted ? 'blur-sm opacity-40 pointer-events-none' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Net Approved Gains</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end border-b border-border/50 pb-4 mb-4">
                <span className="text-lg font-semibold text-accent">A-Coins</span>
                <span className="text-3xl font-display font-bold text-accent">+{totalGainedACoins.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-lg font-semibold text-primary">Credits</span>
                <span className="text-3xl font-display font-bold text-primary">+{totalGainedCredits.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Prediction */}
          <Card className={`glass-panel border-muted ${!protocolStarted ? 'blur-sm' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> End Prediction (Aug 15)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-accent uppercase tracking-wider">A-Coins by Aug 15</p>
                  <span className="text-xs text-muted-foreground">+{Math.round(avgACoinsPerDay)}/day avg</span>
                </div>
                <div className="text-2xl font-display font-bold text-accent">
                  {Math.round(Math.max(user.startACoins, predictedACoins)).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">from {user.startACoins.toLocaleString()} starting</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">Credits by Aug 15</p>
                  <span className="text-xs text-muted-foreground">+{Math.round(avgCreditsPerDay)}/day avg</span>
                </div>
                <div className="text-2xl font-display font-bold text-primary">
                  {Math.round(Math.max(user.startCredits, predictedCredits)).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">from {user.startCredits.toLocaleString()} starting</p>
              </div>
              <div className="text-xs text-muted-foreground pt-1 border-t border-border/30 text-center">
                {daysRemaining} days remaining · {approvedLogs.length} submissions approved
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Chart & Form Column ── */}
        <div className="lg:col-span-2 space-y-6">
          <Card className={`glass-panel overflow-hidden border-border/50 transition-all ${!protocolStarted ? 'blur-sm opacity-40 pointer-events-none' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-base font-semibold">Cumulative Gains</CardTitle>
                <span className="text-xs text-muted-foreground">{approvedLogs.length} approved data point{approvedLogs.length !== 1 ? 's' : ''}</span>
              </div>
              <CardDescription className="text-xs">Running total of A-Coins and Credits gained since challenge start.</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <TrendingUp className="h-8 w-8 opacity-30" />
                  <span className="text-sm">No approved submissions yet.</span>
                  <span className="text-xs opacity-60">Your growth curve will appear here.</span>
                </div>
              ) : (
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                      <defs>
                        <linearGradient id="acGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="crGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="day"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                        width={40}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="acGain"
                        name="AC Gained"
                        stroke="hsl(var(--accent))"
                        strokeWidth={2.5}
                        fill="url(#acGrad)"
                        dot={chartData.length <= 14 ? { r: 3, fill: 'hsl(var(--accent))', strokeWidth: 0 } : false}
                        activeDot={{ r: 5, fill: 'hsl(var(--accent))' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="crGain"
                        name="CR Gained"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        fill="url(#crGrad)"
                        dot={chartData.length <= 14 ? { r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 } : false}
                        activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submission Form */}
          <Card className={`glass-panel border-primary/30 relative overflow-hidden transition-all ${submittedToday ? 'opacity-60' : ''} ${!protocolStarted ? 'blur-sm opacity-40 pointer-events-none' : ''}`}>
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            {submittedToday && (
              <div className="absolute inset-0 bg-background/40 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10">
                <Lock className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm font-semibold text-center px-4">Daily submission limit reached</p>
                <p className="text-xs text-muted-foreground mt-1">Available at 12:00 AM {user?.timezone}</p>
              </div>
            )}
            <CardHeader>
              <CardTitle className="font-display text-base font-semibold text-primary">Daily Submission</CardTitle>
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
                      type="number" min="0" value={aCoins}
                      onChange={(e) => setACoins(e.target.value)}
                      className="bg-background/50 border-primary/20 focus-visible:ring-primary"
                      placeholder="e.g. 5000"
                      disabled={user.isDisqualified || !!submittedToday}
                      data-testid="input-acoins"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-accent">Current Credits</Label>
                    <Input
                      type="number" min="0" value={credits}
                      onChange={(e) => setCredits(e.target.value)}
                      className="bg-background/50 border-accent/20 focus-visible:ring-accent"
                      placeholder="e.g. 150000"
                      disabled={user.isDisqualified || !!submittedToday}
                      data-testid="input-credits"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Screenshot Proof</Label>
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${submittedToday ? 'border-muted-foreground/10 bg-muted/5' : 'border-muted-foreground/30 hover:bg-muted/20'}`}>
                    <Input
                      type="file" accept="image/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden" id="file-upload"
                      disabled={user.isDisqualified || !!submittedToday}
                      data-testid="input-screenshot"
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
                  disabled={submitLog.isPending || user.isDisqualified || !!submittedToday}
                  data-testid="button-submit"
                >
                  {submittedToday ? "SUBMISSION COMPLETE TODAY" : submitLog.isPending ? "TRANSMITTING..." : "SUBMIT RESOURCES"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submission History */}
      <div className={`transition-all ${!protocolStarted ? 'blur-sm opacity-40 pointer-events-none' : ''}`}>
        <h2 className="text-lg font-display font-semibold text-foreground mt-12 mb-4">Submission History</h2>
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
                    <div className="font-display font-bold">{log.aCoins.toLocaleString()}</div>
                    {log.status === 'approved' && log.aCoinChange !== 0 && (
                      <div className={`text-xs ${log.aCoinChange > 0 ? 'text-green-500' : 'text-destructive'}`}>
                        {log.aCoinChange > 0 ? '+' : ''}{log.aCoinChange}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase">Credits</div>
                    <div className="font-display font-bold">{log.credits.toLocaleString()}</div>
                    {log.status === 'approved' && log.creditsChange !== 0 && (
                      <div className={`text-xs ${log.creditsChange > 0 ? 'text-green-500' : 'text-destructive'}`}>
                        {log.creditsChange > 0 ? '+' : ''}{log.creditsChange}
                      </div>
                    )}
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
