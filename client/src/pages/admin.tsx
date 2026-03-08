import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePendingLogs, useUpdateLogStatus } from "@/hooks/use-logs";
import { useGlobalStats } from "@/hooks/use-stats";
import { useUsers, useUpdateUserRole } from "@/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShieldAlert, Users, TrendingUp, Check, X, Gavel } from "lucide-react";
import { useLocation } from "wouter";

export default function Admin() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const { data: stats } = useGlobalStats();
  const { data: pendingLogs, isLoading: loadingLogs } = usePendingLogs();
  const { data: usersList } = useUsers();
  const updateLog = useUpdateLogStatus();
  const updateRole = useUpdateUserRole();
  const { toast } = useToast();

  const [notes, setNotes] = useState("");

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
        <Card className="glass-panel border-primary/20">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Global A-Coins</div>
            <div className="text-3xl font-display font-bold text-primary">+{stats?.totalACoinsGained?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-purple-500/20">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Global Credits</div>
            <div className="text-3xl font-display font-bold text-purple-400">+{stats?.totalCreditsGained?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full mt-8">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 bg-card border border-border">
          <TabsTrigger value="pending" className="uppercase font-display tracking-wider data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
            Pending Submissions
          </TabsTrigger>
          <TabsTrigger value="users" className="uppercase font-display tracking-wider data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
            Player Registry
          </TabsTrigger>
        </TabsList>

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
                        <div className="font-display text-primary font-bold text-xl">{log.aCoins}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase">Reported Credits</div>
                        <div className="font-display text-purple-400 font-bold text-xl">{log.credits}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-auto space-y-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full border-accent/50 text-accent hover:bg-accent/10">VIEW PROOF</Button>
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
                      <Button onClick={() => handleLogAction(log.id, 'approved')} className="flex-1 bg-green-600/20 text-green-500 hover:bg-green-600/30 hover:text-green-400 border border-green-600/30">
                        <Check className="h-4 w-4 mr-2" /> APPROVE
                      </Button>
                      <Button onClick={() => handleLogAction(log.id, 'rejected')} className="flex-1 bg-red-600/20 text-red-500 hover:bg-red-600/30 hover:text-red-400 border border-red-600/30">
                        <X className="h-4 w-4 mr-2" /> REJECT
                      </Button>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-destructive">PENALIZE PILOT</Button>
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

        <TabsContent value="users">
          <div className="rounded-md border border-border/50 overflow-hidden bg-card/50">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border/50 text-muted-foreground uppercase font-display text-xs">
                <tr>
                  <th className="px-6 py-4">Pilot</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {usersList?.map(u => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{u.username}</td>
                    <td className="px-6 py-4">
                      {u.isDisqualified ? (
                        <span className="text-destructive text-xs uppercase border border-destructive/30 bg-destructive/10 px-2 py-1 rounded">Disqualified</span>
                      ) : (
                        <span className="text-green-500 text-xs uppercase border border-green-500/30 bg-green-500/10 px-2 py-1 rounded">Active</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs uppercase px-2 py-1 rounded ${u.role === 'admin' ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-muted text-muted-foreground'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.id !== user.id && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRoleToggle(u.id, u.role)}
                          className="text-xs hover:text-accent"
                        >
                          Toggle Role
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Need to import Activity since I used it above
import { Activity } from "lucide-react";
