import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useMyLogs, useSubmitLog } from "@/hooks/use-logs";
import { CountdownTimer } from "@/components/countdown-timer";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Upload, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
      toast({ title: "Submission Received", description: "Awaiting admin verification." });
      setACoins("");
      setCredits("");
      setFile(null);
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message, variant: "destructive" });
    }
  };

  if (!user) return null;

  const totalGainedACoins = logs?.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.aCoinChange, 0) || 0;
  const totalGainedCredits = logs?.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.creditsChange, 0) || 0;

  // Chart data prep: Group by date and extend through challenge end
  const logsByDate = new Map<string, { aCoins: number; credits: number }>();
  
  // Group submitted logs by date
  logs?.forEach(log => {
    const date = log.date;
    if (!logsByDate.has(date)) {
      logsByDate.set(date, { aCoins: 0, credits: 0 });
    }
    const entry = logsByDate.get(date)!;
    entry.aCoins = log.aCoins; // Take latest submission value
    entry.credits = log.credits;
  });
  
  // Convert to array, sort by date, and extend through challenge end
  const sortedDates = Array.from(logsByDate.keys()).sort();
  let chartData = sortedDates.map((date, i) => ({
    date,
    day: `Day ${i + 1}`,
    aCoins: logsByDate.get(date)?.aCoins || 0,
    credits: logsByDate.get(date)?.credits || 0
  }));
  
  // Extend chart with projected empty days through Aug 24, 2026
  if (chartData.length > 0) {
    const lastDate = new Date(chartData[chartData.length - 1].date);
    let currentDate = new Date(lastDate);
    let dayCount = chartData.length;
    
    while (currentDate < challengeEnd) {
      currentDate.setDate(currentDate.getDate() + 1);
      if (currentDate <= challengeEnd) {
        const dateStr = currentDate.toISOString().split('T')[0];
        chartData.push({
          date: dateStr,
          day: `Day ${++dayCount}`,
          aCoins: chartData[chartData.length - 1].aCoins,
          credits: chartData[chartData.length - 1].credits
        });
      }
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Column */}
        <div className="space-y-6">
          <CountdownTimer 
            targetDate={countdownTarget} 
            label={countdownLabel}
            passedLabel={protocolStarted ? "Protocol End" : "Protocol Start"}
          />
          
          <Card className="glass-panel border-accent/20">
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

          <Card className="glass-panel border-muted">
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
          <Card className="glass-panel overflow-hidden border-border/50">
            <CardHeader>
              <CardTitle className="font-display tracking-widest uppercase">Resource Trajectory</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <Card className="glass-panel border-primary/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardHeader>
              <CardTitle className="font-display tracking-widest uppercase text-primary">Daily Submission</CardTitle>
              <CardDescription>Upload screenshot proof of your current resources.</CardDescription>
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
                      disabled={user.isDisqualified}
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
                      disabled={user.isDisqualified}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Screenshot Proof</Label>
                  <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center hover:bg-muted/20 transition-colors">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden" 
                      id="file-upload"
                      disabled={user.isDisqualified}
                    />
                    <Label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {file ? file.name : "Click to select or drag and drop image"}
                      </span>
                    </Label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 font-display tracking-widest text-base shadow-[0_0_15px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_25px_hsl(var(--primary)/0.5)] transition-all mt-4" 
                  disabled={submitLog.isPending || user.isDisqualified}
                >
                  {submitLog.isPending ? "TRANSMITTING..." : "SUBMIT RESOURCES"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Submissions Log */}
      <h2 className="text-xl font-display uppercase tracking-widest text-primary mt-12 mb-4">Submission History</h2>
      <div className="space-y-3">
        {loadingLogs ? (
          <div className="text-center p-8 text-muted-foreground">Loading logs...</div>
        ) : logs?.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-border/50 rounded-lg text-muted-foreground">No submissions yet.</div>
        ) : (
          logs?.slice(0, 5).map((log) => (
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
  );
}
