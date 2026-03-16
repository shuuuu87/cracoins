import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useMyStats } from "@/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarSelector } from "@/components/avatar-selector";
import { getAvatarImage } from "@/lib/avatars";
import { UserCog, CheckCircle2, XCircle, Clock, Coins, CreditCard, ShieldAlert, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "India", "Germany", "France", "Spain",
  "Italy", "Japan", "South Korea", "China", "Brazil", "Mexico", "Russia", "South Africa",
  "Singapore", "Malaysia", "Philippines", "Thailand", "Indonesia", "Vietnam", "Pakistan",
  "Bangladesh", "Egypt", "Nigeria", "Kenya", "Argentina", "Chile", "Colombia", "Peru",
  "Other"
];

const updateSchema = z.object({
  username: z.string().min(1, "Username is required").optional(),
  country: z.string().optional(),
  avatar: z.string().optional(),
});

export default function Profile() {
  const { user, updateProfile, isUpdatingProfile } = useAuth();
  const { data: myStats, isLoading: statsLoading } = useMyStats();
  const { data: pendingLogs } = useQuery({
    queryKey: ['/api/admin/logs/pending'],
    queryFn: async () => {
      const res = await fetch('/api/admin/logs/pending', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: user?.role === 'admin',
  });
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const form = useForm<z.infer<typeof updateSchema>>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      username: user?.username || "",
      country: user?.country || "",
      avatar: user?.avatar || "avatar1",
    },
  });

  const onSubmit = async (data: z.infer<typeof updateSchema>) => {
    try {
      await updateProfile(data);
      toast({ title: "Profile Updated", description: "Identity parameters reconfigured successfully." });
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  };

  if (!user) return null;

  const approvalRate = myStats && myStats.totalSubmissions > 0
    ? Math.round((myStats.approved / myStats.totalSubmissions) * 100)
    : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center">
            <UserCog className="h-5 w-5 text-white" />
          </div>
          My Profile
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      {/* Stats Section */}
      <Card className="glass-panel border-accent/20">
        <CardHeader>
          <CardTitle className="font-display font-semibold text-base">Challenge Stats</CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="rounded-xl bg-accent/10 border border-accent/20 p-4 text-center">
                <div className="text-2xl font-display font-bold text-accent">{myStats?.totalACoinsEarned.toLocaleString() ?? 0}</div>
                <div className="text-xs text-muted-foreground uppercase mt-1 flex items-center justify-center gap-1"><Coins className="h-3 w-3" /> A-Coins Earned</div>
              </div>
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center">
                <div className="text-2xl font-display font-bold text-primary">{myStats?.totalCreditsEarned.toLocaleString() ?? 0}</div>
                <div className="text-xs text-muted-foreground uppercase mt-1 flex items-center justify-center gap-1"><CreditCard className="h-3 w-3" /> Credits Earned</div>
              </div>
              <div className="rounded-xl bg-muted/30 border border-border/50 p-4 text-center col-span-2 md:col-span-1">
                <div className="text-2xl font-display font-bold text-foreground">{myStats?.totalSubmissions ?? 0}</div>
                <div className="text-xs text-muted-foreground uppercase mt-1">Total Reports</div>
              </div>
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
                <div className="text-2xl font-display font-bold text-green-500">{myStats?.approved ?? 0}</div>
                <div className="text-xs text-muted-foreground uppercase mt-1 flex items-center justify-center gap-1"><CheckCircle2 className="h-3 w-3" /> Approved</div>
              </div>
              <div className="rounded-xl bg-red-400/10 border border-red-400/20 p-4 text-center">
                <div className="text-2xl font-display font-bold text-red-400">{myStats?.rejected ?? 0}</div>
                <div className="text-xs text-muted-foreground uppercase mt-1 flex items-center justify-center gap-1"><XCircle className="h-3 w-3" /> Rejected</div>
              </div>
              <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4 text-center">
                <div className="text-2xl font-display font-bold text-yellow-500">{approvalRate}%</div>
                <div className="text-xs text-muted-foreground uppercase mt-1">Approval Rate</div>
              </div>
            </div>
          )}

          {myStats && myStats.pending > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-yellow-600 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{myStats.pending} submission{myStats.pending > 1 ? 's' : ''} awaiting admin review.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Quick Actions (admin only) */}
      {user.role === 'admin' && (
        <Card className="glass-panel border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="font-display font-semibold text-base flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-4 w-4" /> Admin Quick Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-between border-destructive/30 hover:bg-destructive/10 hover:text-destructive text-sm"
              onClick={() => setLocation('/admin')}
              data-testid="button-goto-admin"
            >
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Admin Override Panel
                {pendingLogs && pendingLogs.length > 0 && (
                  <span className="bg-destructive text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingLogs.length} pending
                  </span>
                )}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Profile Settings */}
      <Card className="glass-panel border-primary/20">
        <CardHeader>
          <CardTitle className="font-display font-semibold text-base">Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 mb-8 p-5 bg-muted/20 rounded-xl border border-border/50">
            <Avatar className="h-20 w-20 border-2 border-primary/50 shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
              <AvatarImage src={getAvatarImage(form.watch('avatar') || user.avatar) || undefined} alt={user.username} />
              <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-display font-bold">{user.username}</h2>
              <div className={`text-xs uppercase mt-1 font-medium ${user.isDisqualified ? 'text-destructive' : 'text-green-500'}`}>
                {user.isDisqualified ? '⛔ Disqualified' : '✅ Active Pilot'}
              </div>
              <div className="text-xs text-muted-foreground uppercase mt-0.5">Role: {user.role}</div>
              {user.country && <div className="text-xs text-muted-foreground mt-0.5">{user.country}</div>}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Callsign (Username)</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-background/50 focus-visible:ring-primary" data-testid="input-username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region / Country</FormLabel>
                      <Select value={field.value || user?.country || ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50" data-testid="select-country">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="avatar"
                  render={({ field }) => (
                    <FormItem>
                      <AvatarSelector value={field.value || user.avatar} onChange={field.onChange} label="Pilot Avatar" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="font-display tracking-widest w-full h-12 mt-4" disabled={isUpdatingProfile} data-testid="button-submit-profile">
                {isUpdatingProfile ? "SAVING..." : "COMMIT CHANGES"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
