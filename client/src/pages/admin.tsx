import { useState, Fragment } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePendingLogs, useUpdateLogStatus } from "@/hooks/use-logs";
import { useGlobalStats } from "@/hooks/use-stats";
import { useUsers, useUpdateUserRole, useReinstateUser, useUpdateStartingValues, useUserLogs } from "@/hooks/use-users";
import { useAnnounce } from "@/hooks/use-announce";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ShieldAlert, Users, TrendingUp, Check, X, Gavel, Activity, RotateCcw, Sliders, Megaphone, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Admin() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const { data: stats } = useGlobalStats();
  const { data: pendingLogs, isLoading: loadingLogs } = usePendingLogs();
  const { data: usersList } = useUsers();
  const updateLog = useUpdateLogStatus();
  const updateRole = useUpdateUserRole();
  const reinstateUser = useReinstateUser();
  const updateStartingValues = useUpdateStartingValues();
  const announce = useAnnounce();
  const { toast } = useToast();

  const [notes, setNotes] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [editingUser, setEditingUser] = useState<{ id: number; username: string; startACoins: number; startCredits: number } | null>(null);
  const [startACoins, setStartACoins] = useState("");
  const [startCredits, setStartCredits] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  if (user?.role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  const handleLogAction = async (id: number, status: 'approved' | 'rejected' | 'disqualified') => {
    try {
      await updateLog.mutateAsync({ id, status, adminNotes: notes });
      toast({ title: `Log ${status}`, description: `Action executed successfully.` });
      setNotes("");
    } catch (err: any) {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleRoleToggle = async (id: number, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await updateRole.mutateAsync({ id, role: newRole });
      toast({ title: "Role Updated", description: `User role changed to ${newRole}.` });
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleReinstate = async (id: number, username: string) => {
    try {
      await reinstateUser.mutateAsync(id);
      toast({ title: "Pilot Reinstated", description: `${username} is back in the challenge.` });
    } catch (err: any) {
      toast({ title: "Reinstate Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleStartingValues = async () => {
    if (!editingUser) return;
    try {
      await updateStartingValues.mutateAsync({
        id: editingUser.id,
        startACoins: parseInt(startACoins),
        startCredits: parseInt(startCredits),
      });
      toast({ title: "Starting Values Updated", description: `${editingUser.username}'s starting resources updated.` });
      setEditingUser(null);
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleAnnounce = async () => {
    if (!announcement.trim()) return;
    try {
      await announce.mutateAsync(announcement);
      toast({ title: "Announcement Posted", description: "Your message is live on the network feed." });
      setAnnouncement("");
    } catch (err: any) {
      toast({ title: "Announce Failed", description: err.message, variant: "destructive" });
    }
  };

  const openStartingValues = (u: any) => {
    setEditingUser({ id: u.id, username: u.username, startACoins: u.startACoins, startCredits: u.startCredits });
    setStartACoins(String(u.startACoins ?? 0));
    setStartCredits(String(u.startCredits ?? 0));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-accent text-shadow-glow flex items-center gap-3">
          <ShieldAlert className="h-8 w-8" />
          Admin Override
        </h1>
        <p className="text-muted-foreground mt-1">Host panel for challenge management.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-panel border-accent/20">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4" /> Total Pilots
            </div>
            <div className="text-3xl font-display font-bold text-foreground">{stats?.totalPlayers || 0}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-accent/20">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4" /> Active Today
            </div>
            <div className="text-3xl font-display font-bold text-foreground">{stats?.activeToday || 0}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-accent/20">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Global A-Coins</div>
            <div className="text-3xl font-display font-bold text-accent">+{stats?.totalACoinsGained?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-primary/20">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Global Credits</div>
            <div className="text-3xl font-display font-bold text-primary">+{stats?.totalCreditsGained?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full mt-8">
        <TabsList className="grid w-full max-w-xl grid-cols-3 mb-6 bg-card border border-border">
          <TabsTrigger value="pending" className="uppercase font-display tracking-wider text-xs data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
            Submissions {pendingLogs && pendingLogs.length > 0 && <span className="ml-1.5 bg-accent text-white text-[10px] rounded-full px-1.5 py-0.5">{pendingLogs.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="users" className="uppercase font-display tracking-wider text-xs data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
            Player Registry
          </TabsTrigger>
          <TabsTrigger value="announce" className="uppercase font-display tracking-wider text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            Announce
          </TabsTrigger>
        </TabsList>

        {/* PENDING SUBMISSIONS */}
        <TabsContent value="pending" className="space-y-4">
          {loadingLogs ? (
             <div className="text-center p-8 text-muted-foreground">Scanning queue...</div>
          ) : pendingLogs?.length === 0 ? (
             <div className="text-center p-12 border border-dashed border-border rounded-lg text-muted-foreground">No pending submissions. Queue clear.</div>
          ) : (
            pendingLogs?.map((log) => (
              <Card key={log.id} className="glass-panel border-border/50">
                <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-lg">{log.user.username}</span>
                      <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground uppercase">{new Date(log.date).toLocaleDateString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 max-w-sm mt-2">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase">Reported A-Coins</div>
                        <div className="font-display text-accent font-bold text-xl">{log.aCoins.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase">Reported Credits</div>
                        <div className="font-display text-primary font-bold text-xl">{log.credits.toLocaleString()}</div>
                      </div>
                    </div>
                    {(log.aCoinChange !== 0 || log.creditsChange !== 0) && (
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>Change: <span className={log.aCoinChange >= 0 ? "text-green-500" : "text-destructive"}>{log.aCoinChange >= 0 ? '+' : ''}{log.aCoinChange} AC</span></span>
                        <span><span className={log.creditsChange >= 0 ? "text-green-500" : "text-destructive"}>{log.creditsChange >= 0 ? '+' : ''}{log.creditsChange} CR</span></span>
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full md:w-auto space-y-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full border-accent/50 text-accent hover:bg-accent/10" data-testid={`button-view-proof-${log.id}`}>VIEW PROOF</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl bg-card border-accent/30">
                        <DialogHeader>
                          <DialogTitle className="font-display uppercase tracking-widest text-accent">Evidence Scan: {log.user.username}</DialogTitle>
                        </DialogHeader>
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-border/50 bg-black flex items-center justify-center">
                          <img src={log.screenshotUrl} alt="Proof" className="max-h-full object-contain" />
                        </div>
                      </DialogContent>
                    </Dialog>

                    <div className="flex gap-2">
                      <Button onClick={() => handleLogAction(log.id, 'approved')} className="flex-1 bg-green-600/20 text-green-500 hover:bg-green-600/30 hover:text-green-400 border border-green-600/30" data-testid={`button-approve-${log.id}`}>
                        <Check className="h-4 w-4 mr-2" /> APPROVE
                      </Button>
                      <Button onClick={() => handleLogAction(log.id, 'rejected')} className="flex-1 bg-red-600/20 text-red-500 hover:bg-red-600/30 hover:text-red-400 border border-red-600/30" data-testid={`button-reject-${log.id}`}>
                        <X className="h-4 w-4 mr-2" /> REJECT
                      </Button>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-destructive" data-testid={`button-penalize-${log.id}`}>PENALIZE PILOT</Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-destructive/50">
                        <DialogHeader>
                          <DialogTitle className="text-destructive font-display uppercase tracking-widest">Execute Penalty</DialogTitle>
                          <DialogDescription>Add a note and disqualify the user for breaking protocol.</DialogDescription>
                        </DialogHeader>
                        <Input placeholder="Reason for penalty..." value={notes} onChange={e => setNotes(e.target.value)} className="bg-background/50" />
                        <Button onClick={() => handleLogAction(log.id, 'disqualified')} variant="destructive" className="w-full mt-4 font-display tracking-widest">
                          <Gavel className="h-4 w-4 mr-2" /> DISQUALIFY
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* PLAYER REGISTRY */}
        <TabsContent value="users">
          <div className="rounded-xl border border-border/50 overflow-hidden bg-card/50">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border/50 text-muted-foreground uppercase font-display text-xs">
                <tr>
                  <th className="px-4 py-4">Pilot</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {usersList?.map(u => (
                  <Fragment key={u.id}>
                    <tr className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <button
                          className="flex items-center gap-1.5 hover:text-accent transition-colors"
                          onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}
                          data-testid={`button-expand-user-${u.id}`}
                        >
                          {expandedUserId === u.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          {u.username}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {u.isDisqualified ? (
                          <span className="text-destructive text-xs uppercase border border-destructive/30 bg-destructive/10 px-2 py-1 rounded">Disqualified</span>
                        ) : (
                          <span className="text-green-500 text-xs uppercase border border-green-500/30 bg-green-500/10 px-2 py-1 rounded">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs uppercase px-2 py-1 rounded ${u.role === 'admin' ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-muted text-muted-foreground'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end flex-wrap">
                          {u.id !== user.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRoleToggle(u.id, u.role)}
                              className="text-xs hover:text-accent h-7 px-2"
                              data-testid={`button-toggle-role-${u.id}`}
                            >
                              Toggle Role
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openStartingValues(u)}
                            className="text-xs hover:text-primary h-7 px-2"
                            data-testid={`button-edit-start-${u.id}`}
                          >
                            <Sliders className="h-3 w-3 mr-1" /> Start Values
                          </Button>
                          {u.isDisqualified && u.id !== user.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReinstate(u.id, u.username)}
                              disabled={reinstateUser.isPending}
                              className="text-xs hover:text-blue-500 h-7 px-2"
                              data-testid={`button-reinstate-${u.id}`}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" /> Reinstate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedUserId === u.id && (
                      <tr>
                        <td colSpan={4} className="px-4 py-0 bg-muted/10">
                          <UserLogsPanel userId={u.id} username={u.username} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Edit Starting Values Dialog */}
          <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
            <DialogContent className="bg-card border-primary/30">
              <DialogHeader>
                <DialogTitle className="font-display uppercase tracking-widest text-primary flex items-center gap-2">
                  <Sliders className="h-5 w-5" /> Edit Starting Values
                </DialogTitle>
                <DialogDescription>
                  Adjust {editingUser?.username}'s starting resource baselines. This affects all gain calculations.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase text-muted-foreground">Starting A-Coins</Label>
                  <Input
                    type="number"
                    value={startACoins}
                    onChange={e => setStartACoins(e.target.value)}
                    className="bg-background/50 focus-visible:ring-accent"
                    data-testid="input-start-acoins"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase text-muted-foreground">Starting Credits</Label>
                  <Input
                    type="number"
                    value={startCredits}
                    onChange={e => setStartCredits(e.target.value)}
                    className="bg-background/50 focus-visible:ring-primary"
                    data-testid="input-start-credits"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                <Button
                  onClick={handleStartingValues}
                  disabled={updateStartingValues.isPending}
                  className="font-display tracking-widest"
                  data-testid="button-save-starting-values"
                >
                  {updateStartingValues.isPending ? "SAVING..." : "SAVE CHANGES"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ANNOUNCE TAB */}
        <TabsContent value="announce">
          <Card className="glass-panel border-primary/20 max-w-2xl">
            <CardHeader>
              <CardTitle className="font-display font-semibold text-base flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                Broadcast Announcement
              </CardTitle>
              <CardDescription>Post a custom message to the Network Feed. All players will see it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type your announcement here... (e.g. 'Challenge rules updated. Check the protocol.' or 'Milestone rewards announced!')"
                value={announcement}
                onChange={e => setAnnouncement(e.target.value)}
                className="bg-background/50 min-h-[120px] resize-none focus-visible:ring-primary"
                data-testid="input-announcement"
              />
              <Button
                onClick={handleAnnounce}
                disabled={!announcement.trim() || announce.isPending}
                className="w-full font-display tracking-widest h-12"
                data-testid="button-post-announcement"
              >
                <Megaphone className="h-4 w-4 mr-2" />
                {announce.isPending ? "POSTING..." : "POST TO NETWORK"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserLogsPanel({ userId, username }: { userId: number; username: string }) {
  const { data: logs, isLoading } = useUserLogs(userId);

  return (
    <div className="py-3 px-2">
      <div className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
        <FileText className="h-3.5 w-3.5" /> {username}'s Submission History
      </div>
      {isLoading ? (
        <div className="text-xs text-muted-foreground py-2">Loading...</div>
      ) : !logs || logs.length === 0 ? (
        <div className="text-xs text-muted-foreground py-2">No submissions yet.</div>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {logs.map((log: any) => (
            <div key={log.id} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-background/60 border border-border/40">
              <span className="text-muted-foreground">{new Date(log.date).toLocaleDateString()}</span>
              <span className="font-display text-accent">{log.aCoins.toLocaleString()} AC</span>
              <span className="font-display text-primary">{log.credits.toLocaleString()} CR</span>
              <span className={`uppercase font-display text-[10px] px-2 py-0.5 rounded border ${
                log.status === 'approved' ? 'text-green-500 border-green-500/30 bg-green-500/10' :
                log.status === 'rejected' ? 'text-red-400 border-red-400/30 bg-red-400/10' :
                log.status === 'disqualified' ? 'text-destructive border-destructive/30 bg-destructive/10' :
                'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
              }`}>{log.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
