import { useState, Fragment } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePendingLogs, useUpdateLogStatus, useBatchUpdateLogs, useAllAdminLogs } from "@/hooks/use-logs";
import { useGlobalStats } from "@/hooks/use-stats";
import { useUsers, useUpdateUserRole, useReinstateUser, useUpdateStartingValues, useUserLogs, useDisqualifyUser, useWarnUser, useDeleteUser } from "@/hooks/use-users";
import { useAnnounce } from "@/hooks/use-announce";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  ShieldAlert, Users, TrendingUp, Check, X, Gavel, Activity, RotateCcw,
  Sliders, Megaphone, FileText, ChevronDown, ChevronRight, Search,
  AlertTriangle, Trash2, Filter, CheckSquare, XSquare, Eye, Database,
  Clock, UserX, BarChart2,
} from "lucide-react";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarImage } from "@/lib/avatars";

export default function Admin() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const { data: stats } = useGlobalStats();
  const { data: pendingLogs, isLoading: loadingLogs } = usePendingLogs();
  const { data: usersList } = useUsers();
  const updateLog = useUpdateLogStatus();
  const batchUpdate = useBatchUpdateLogs();
  const updateRole = useUpdateUserRole();
  const reinstateUser = useReinstateUser();
  const disqualifyUser = useDisqualifyUser();
  const warnUser = useWarnUser();
  const deleteUser = useDeleteUser();
  const updateStartingValues = useUpdateStartingValues();
  const announce = useAnnounce();
  const { toast } = useToast();

  const [notes, setNotes] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [editingUser, setEditingUser] = useState<{ id: number; username: string; startACoins: number; startCredits: number } | null>(null);
  const [startACoins, setStartACoins] = useState("");
  const [startCredits, setStartCredits] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "active" | "disqualified">("all");
  const [disqualifyTarget, setDisqualifyTarget] = useState<{ id: number; username: string } | null>(null);
  const [disqualifyReason, setDisqualifyReason] = useState("");
  const [warnTarget, setWarnTarget] = useState<{ id: number; username: string } | null>(null);
  const [warnReason, setWarnReason] = useState("");
  const [allLogsStatusFilter, setAllLogsStatusFilter] = useState<string>("all");
  const [allLogsUserFilter, setAllLogsUserFilter] = useState<string>("all");

  const { data: allLogs, isLoading: allLogsLoading } = useAllAdminLogs({
    status: allLogsStatusFilter !== "all" ? allLogsStatusFilter : undefined,
    userId: allLogsUserFilter !== "all" ? parseInt(allLogsUserFilter) : undefined,
  });

  if (user?.role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  const disqualifiedCount = usersList?.filter(u => u.isDisqualified).length || 0;
  const activeCount = usersList?.filter(u => !u.isDisqualified).length || 0;

  const handleLogAction = async (id: number, status: 'approved' | 'rejected' | 'disqualified') => {
    try {
      await updateLog.mutateAsync({ id, status, adminNotes: notes });
      toast({ title: `Log ${status}`, description: `Action executed successfully.` });
      setNotes("");
    } catch (err: any) {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleBatchAction = async (status: 'approved' | 'rejected') => {
    if (selectedLogs.length === 0) return;
    try {
      await batchUpdate.mutateAsync({ ids: selectedLogs, status });
      toast({ title: `Batch ${status}`, description: `${selectedLogs.length} submission(s) ${status}.` });
      setSelectedLogs([]);
    } catch (err: any) {
      toast({ title: "Batch Action Failed", description: err.message, variant: "destructive" });
    }
  };

  const toggleLogSelection = (id: number) => {
    setSelectedLogs(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const selectAllPending = () => {
    const allIds = pendingLogs?.map(l => l.id) || [];
    setSelectedLogs(selectedLogs.length === allIds.length ? [] : allIds);
  };

  const handleRoleToggle = async (id: number, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await updateRole.mutateAsync({ id, role: newRole as "user" | "admin" });
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

  const handleDisqualify = async () => {
    if (!disqualifyTarget) return;
    try {
      await disqualifyUser.mutateAsync({ id: disqualifyTarget.id, reason: disqualifyReason });
      toast({ title: "Pilot Disqualified", description: `${disqualifyTarget.username} has been disqualified.` });
      setDisqualifyTarget(null);
      setDisqualifyReason("");
    } catch (err: any) {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleWarn = async () => {
    if (!warnTarget || !warnReason.trim()) return;
    try {
      await warnUser.mutateAsync({ id: warnTarget.id, reason: warnReason });
      toast({ title: "Warning Issued", description: `${warnTarget.username} has been warned.` });
      setWarnTarget(null);
      setWarnReason("");
    } catch (err: any) {
      toast({ title: "Warning Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteUser = async (id: number, username: string) => {
    try {
      await deleteUser.mutateAsync(id);
      toast({ title: "User Deleted", description: `${username} and all their data have been removed.` });
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
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

  const filteredUsers = usersList?.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(userSearch.toLowerCase());
    const matchesStatus =
      userStatusFilter === "all" ? true :
      userStatusFilter === "active" ? !u.isDisqualified :
      u.isDisqualified;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      approved: "bg-green-500/10 text-green-500 border-green-500/30",
      rejected: "bg-red-400/10 text-red-400 border-red-400/30",
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
      disqualified: "bg-destructive/10 text-destructive border-destructive/30",
    };
    return map[status] || "bg-muted text-muted-foreground border-border";
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

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="glass-panel border-accent/20">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Total Pilots
            </div>
            <div className="text-2xl font-display font-bold">{stats?.totalPlayers || 0}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-green-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-green-500" /> Active
            </div>
            <div className="text-2xl font-display font-bold text-green-500">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-destructive/20">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <UserX className="h-3.5 w-3.5 text-destructive" /> Disqualified
            </div>
            <div className="text-2xl font-display font-bold text-destructive">{disqualifiedCount}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-yellow-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-yellow-500" /> Pending
            </div>
            <div className="text-2xl font-display font-bold text-yellow-500">{pendingLogs?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-accent/20">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Global AC</div>
            <div className="text-2xl font-display font-bold text-accent">+{stats?.totalACoinsGained?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-primary/20">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Global CR</div>
            <div className="text-2xl font-display font-bold text-primary">+{stats?.totalCreditsGained?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full mt-4">
        <TabsList className="flex flex-wrap gap-1 h-auto bg-card border border-border mb-6 p-1">
          <TabsTrigger value="pending" className="uppercase font-display tracking-wider text-xs data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
            Submissions {pendingLogs && pendingLogs.length > 0 && <span className="ml-1.5 bg-accent text-white text-[10px] rounded-full px-1.5 py-0.5">{pendingLogs.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="alllogs" className="uppercase font-display tracking-wider text-xs data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
            <Database className="h-3.5 w-3.5 mr-1.5" /> All Logs
          </TabsTrigger>
          <TabsTrigger value="users" className="uppercase font-display tracking-wider text-xs data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
            <Users className="h-3.5 w-3.5 mr-1.5" /> Player Registry
          </TabsTrigger>
          <TabsTrigger value="announce" className="uppercase font-display tracking-wider text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Megaphone className="h-3.5 w-3.5 mr-1.5" /> Announce
          </TabsTrigger>
        </TabsList>

        {/* ===== PENDING SUBMISSIONS ===== */}
        <TabsContent value="pending" className="space-y-4">
          {/* Batch actions bar */}
          {pendingLogs && pendingLogs.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/50">
              <button
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={selectAllPending}
                data-testid="button-select-all"
              >
                <Checkbox checked={selectedLogs.length === pendingLogs.length && pendingLogs.length > 0} />
                <span>Select All ({selectedLogs.length}/{pendingLogs.length})</span>
              </button>
              {selectedLogs.length > 0 && (
                <>
                  <div className="h-4 w-px bg-border" />
                  <Button
                    size="sm"
                    onClick={() => handleBatchAction('approved')}
                    disabled={batchUpdate.isPending}
                    className="bg-green-600/20 text-green-500 hover:bg-green-600/30 border border-green-600/30 h-7 text-xs"
                    data-testid="button-batch-approve"
                  >
                    <CheckSquare className="h-3.5 w-3.5 mr-1" /> Approve {selectedLogs.length}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleBatchAction('rejected')}
                    disabled={batchUpdate.isPending}
                    className="bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30 h-7 text-xs"
                    data-testid="button-batch-reject"
                  >
                    <XSquare className="h-3.5 w-3.5 mr-1" /> Reject {selectedLogs.length}
                  </Button>
                </>
              )}
            </div>
          )}

          {loadingLogs ? (
            <div className="text-center p-8 text-muted-foreground">Scanning queue...</div>
          ) : pendingLogs?.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-border rounded-lg text-muted-foreground">No pending submissions. Queue clear.</div>
          ) : (
            pendingLogs?.map((log) => (
              <Card key={log.id} className={`glass-panel border-border/50 transition-all ${selectedLogs.includes(log.id) ? 'ring-2 ring-accent/40 border-accent/30' : ''}`}>
                <CardContent className="p-5 flex flex-col md:flex-row gap-5 items-start md:items-center">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedLogs.includes(log.id)}
                      onCheckedChange={() => toggleLogSelection(log.id)}
                      data-testid={`checkbox-log-${log.id}`}
                      className="mt-1"
                    />
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-display font-bold text-lg">{log.user.username}</span>
                        <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground uppercase">{new Date(log.date).toLocaleDateString()}</span>
                        <span className="text-xs text-muted-foreground">{log.user.country}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 max-w-sm">
                        <div>
                          <div className="text-xs text-muted-foreground uppercase">A-Coins</div>
                          <div className="font-display text-accent font-bold text-xl">{log.aCoins.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground uppercase">Credits</div>
                          <div className="font-display text-primary font-bold text-xl">{log.credits.toLocaleString()}</div>
                        </div>
                      </div>
                      {(log.aCoinChange !== 0 || log.creditsChange !== 0) && (
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>Change: <span className={log.aCoinChange >= 0 ? "text-green-500" : "text-destructive"}>{log.aCoinChange >= 0 ? '+' : ''}{log.aCoinChange} AC</span></span>
                          <span><span className={log.creditsChange >= 0 ? "text-green-500" : "text-destructive"}>{log.creditsChange >= 0 ? '+' : ''}{log.creditsChange} CR</span></span>
                          {log.creditsSpent > 0 && <span className="text-orange-500">Spent: {log.creditsSpent} CR</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex-shrink-0 space-y-2 ml-auto">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full border-accent/50 text-accent hover:bg-accent/10" data-testid={`button-view-proof-${log.id}`}>
                          <Eye className="h-3.5 w-3.5 mr-1.5" /> VIEW PROOF
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl bg-card border-accent/30">
                        <DialogHeader>
                          <DialogTitle className="font-display uppercase tracking-widest text-accent">Evidence: {log.user.username}</DialogTitle>
                        </DialogHeader>
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-border/50 bg-black flex items-center justify-center">
                          <img src={log.screenshotUrl} alt="Proof" className="max-h-full object-contain" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="text-xs text-muted-foreground uppercase mb-1">A-Coin Change</div>
                            <div className={`font-bold text-lg ${log.aCoinChange >= 0 ? 'text-green-500' : 'text-destructive'}`}>{log.aCoinChange >= 0 ? '+' : ''}{log.aCoinChange}</div>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="text-xs text-muted-foreground uppercase mb-1">Credits Change</div>
                            <div className={`font-bold text-lg ${log.creditsChange >= 0 ? 'text-green-500' : 'text-destructive'}`}>{log.creditsChange >= 0 ? '+' : ''}{log.creditsChange}</div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <div className="flex gap-2">
                      <Button onClick={() => handleLogAction(log.id, 'approved')} size="sm" className="flex-1 bg-green-600/20 text-green-500 hover:bg-green-600/30 border border-green-600/30" data-testid={`button-approve-${log.id}`}>
                        <Check className="h-3.5 w-3.5 mr-1" /> OK
                      </Button>
                      <Button onClick={() => handleLogAction(log.id, 'rejected')} size="sm" className="flex-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30" data-testid={`button-reject-${log.id}`}>
                        <X className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-destructive" data-testid={`button-penalize-${log.id}`}>
                          <Gavel className="h-3.5 w-3.5 mr-1.5" /> Penalize Pilot
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-destructive/50">
                        <DialogHeader>
                          <DialogTitle className="text-destructive font-display uppercase tracking-widest">Execute Penalty</DialogTitle>
                          <DialogDescription>Add a note and disqualify the user for breaking protocol.</DialogDescription>
                        </DialogHeader>
                        <Input placeholder="Reason for penalty..." value={notes} onChange={e => setNotes(e.target.value)} className="bg-background/50" data-testid="input-penalty-notes" />
                        <Button onClick={() => handleLogAction(log.id, 'disqualified')} variant="destructive" className="w-full mt-4 font-display tracking-widest" data-testid={`button-disqualify-log-${log.id}`}>
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

        {/* ===== ALL LOGS ===== */}
        <TabsContent value="alllogs" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center p-3 bg-muted/30 rounded-xl border border-border/50">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={allLogsStatusFilter} onValueChange={setAllLogsStatusFilter}>
              <SelectTrigger className="w-36 h-8 text-xs" data-testid="select-log-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="disqualified">Disqualified</SelectItem>
              </SelectContent>
            </Select>
            <Select value={allLogsUserFilter} onValueChange={setAllLogsUserFilter}>
              <SelectTrigger className="w-40 h-8 text-xs" data-testid="select-log-user-filter">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {usersList?.map(u => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.username}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground ml-auto">{allLogs?.length || 0} logs</span>
          </div>

          {allLogsLoading ? (
            <div className="text-center p-8 text-muted-foreground">Loading logs...</div>
          ) : !allLogs || allLogs.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-border rounded-lg text-muted-foreground">No logs found.</div>
          ) : (
            <div className="rounded-xl border border-border/50 overflow-hidden bg-card/50">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border/50 text-muted-foreground uppercase font-display text-xs">
                  <tr>
                    <th className="px-4 py-3">Pilot</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">A-Coins</th>
                    <th className="px-4 py-3">Credits</th>
                    <th className="px-4 py-3">Change</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {allLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{log.user?.username || '—'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{new Date(log.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 font-display text-accent font-semibold">{log.aCoins.toLocaleString()}</td>
                      <td className="px-4 py-2.5 font-display text-primary font-semibold">{log.credits.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-xs">
                        <span className={log.aCoinChange >= 0 ? "text-green-500" : "text-destructive"}>{log.aCoinChange >= 0 ? '+' : ''}{log.aCoinChange} AC</span>
                        {" / "}
                        <span className={log.creditsChange >= 0 ? "text-green-500" : "text-destructive"}>{log.creditsChange >= 0 ? '+' : ''}{log.creditsChange} CR</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] uppercase font-display px-2 py-0.5 rounded border ${getStatusBadge(log.status)}`}>{log.status}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-muted-foreground hover:text-accent" data-testid={`button-view-all-proof-${log.id}`}>
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl bg-card">
                            <DialogHeader>
                              <DialogTitle className="font-display uppercase text-accent">{log.user?.username} — {new Date(log.date).toLocaleDateString()}</DialogTitle>
                            </DialogHeader>
                            <img src={log.screenshotUrl} alt="Proof" className="rounded-lg max-h-96 object-contain mx-auto" />
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ===== PLAYER REGISTRY ===== */}
        <TabsContent value="users">
          {/* Search & Filter */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pilot..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="pl-9 h-9 bg-background/60"
                data-testid="input-user-search"
              />
            </div>
            <Select value={userStatusFilter} onValueChange={v => setUserStatusFilter(v as any)}>
              <SelectTrigger className="w-36 h-9 text-sm" data-testid="select-user-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pilots</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="disqualified">Disqualified</SelectItem>
              </SelectContent>
            </Select>
            <span className="flex items-center text-xs text-muted-foreground px-2">{filteredUsers.length} pilot{filteredUsers.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="rounded-xl border border-border/50 overflow-hidden bg-card/50">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border/50 text-muted-foreground uppercase font-display text-xs">
                <tr>
                  <th className="px-4 py-4">Pilot</th>
                  <th className="px-4 py-4">Country</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredUsers.map(u => (
                  <Fragment key={u.id}>
                    <tr className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2.5">
                          <button
                            className="flex items-center gap-1.5 hover:text-accent transition-colors"
                            onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}
                            data-testid={`button-expand-user-${u.id}`}
                          >
                            {expandedUserId === u.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={getAvatarImage(u.avatar) || undefined} />
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{u.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{u.username}</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{u.country || '—'}</td>
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
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end flex-wrap">
                          {u.id !== user.id && (
                            <Button variant="ghost" size="sm" onClick={() => handleRoleToggle(u.id, u.role)} className="text-xs hover:text-accent h-7 px-2" data-testid={`button-toggle-role-${u.id}`}>
                              Toggle Role
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => openStartingValues(u)} className="text-xs hover:text-primary h-7 px-2" data-testid={`button-edit-start-${u.id}`}>
                            <Sliders className="h-3 w-3 mr-1" /> Start
                          </Button>

                          {/* Warn */}
                          {u.id !== user.id && (
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => setWarnTarget({ id: u.id, username: u.username })}
                              className="text-xs hover:text-yellow-500 h-7 px-2"
                              data-testid={`button-warn-${u.id}`}
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" /> Warn
                            </Button>
                          )}

                          {/* Disqualify / Reinstate */}
                          {u.id !== user.id && (
                            u.isDisqualified ? (
                              <Button variant="ghost" size="sm" onClick={() => handleReinstate(u.id, u.username)} disabled={reinstateUser.isPending} className="text-xs hover:text-blue-500 h-7 px-2" data-testid={`button-reinstate-${u.id}`}>
                                <RotateCcw className="h-3 w-3 mr-1" /> Reinstate
                              </Button>
                            ) : (
                              <Button
                                variant="ghost" size="sm"
                                onClick={() => setDisqualifyTarget({ id: u.id, username: u.username })}
                                className="text-xs hover:text-destructive h-7 px-2"
                                data-testid={`button-disqualify-user-${u.id}`}
                              >
                                <Gavel className="h-3 w-3 mr-1" /> DQ
                              </Button>
                            )
                          )}

                          {/* Delete */}
                          {u.id !== user.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-xs hover:text-destructive h-7 px-2" data-testid={`button-delete-user-${u.id}`}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-card border-destructive/30">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-destructive font-display uppercase">Delete Pilot</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete <strong>{u.username}</strong> and all their submissions. This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(u.id, u.username)}
                                    className="bg-destructive hover:bg-destructive/80"
                                    data-testid={`button-confirm-delete-${u.id}`}
                                  >
                                    Delete Permanently
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedUserId === u.id && (
                      <tr>
                        <td colSpan={5} className="px-4 py-0 bg-muted/10">
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
                <DialogDescription>Adjust {editingUser?.username}'s starting resource baselines.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase text-muted-foreground">Starting A-Coins</Label>
                  <Input type="number" value={startACoins} onChange={e => setStartACoins(e.target.value)} className="bg-background/50" data-testid="input-start-acoins" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase text-muted-foreground">Starting Credits</Label>
                  <Input type="number" value={startCredits} onChange={e => setStartCredits(e.target.value)} className="bg-background/50" data-testid="input-start-credits" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                <Button onClick={handleStartingValues} disabled={updateStartingValues.isPending} data-testid="button-save-starting-values">
                  {updateStartingValues.isPending ? "SAVING..." : "SAVE CHANGES"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Disqualify Dialog */}
          <Dialog open={!!disqualifyTarget} onOpenChange={(open) => !open && setDisqualifyTarget(null)}>
            <DialogContent className="bg-card border-destructive/30">
              <DialogHeader>
                <DialogTitle className="text-destructive font-display uppercase tracking-widest flex items-center gap-2">
                  <Gavel className="h-5 w-5" /> Disqualify {disqualifyTarget?.username}
                </DialogTitle>
                <DialogDescription>This will remove them from rankings and mark their account as disqualified.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">Reason (optional)</Label>
                <Input
                  placeholder="Spending A-Coins, cheating, etc."
                  value={disqualifyReason}
                  onChange={e => setDisqualifyReason(e.target.value)}
                  className="bg-background/50"
                  data-testid="input-disqualify-reason"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDisqualifyTarget(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDisqualify} disabled={disqualifyUser.isPending} data-testid="button-confirm-disqualify">
                  <Gavel className="h-4 w-4 mr-2" /> {disqualifyUser.isPending ? "PROCESSING..." : "DISQUALIFY"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Warn Dialog */}
          <Dialog open={!!warnTarget} onOpenChange={(open) => !open && setWarnTarget(null)}>
            <DialogContent className="bg-card border-yellow-500/30">
              <DialogHeader>
                <DialogTitle className="text-yellow-500 font-display uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Warn {warnTarget?.username}
                </DialogTitle>
                <DialogDescription>Issue a formal warning. It will appear in the activity feed but won't disqualify the user.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">Warning Message</Label>
                <Textarea
                  placeholder="Describe the rule violation or reason for warning..."
                  value={warnReason}
                  onChange={e => setWarnReason(e.target.value)}
                  className="bg-background/50 resize-none min-h-[80px]"
                  data-testid="input-warn-reason"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setWarnTarget(null)}>Cancel</Button>
                <Button
                  onClick={handleWarn}
                  disabled={warnUser.isPending || !warnReason.trim()}
                  className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/30"
                  data-testid="button-confirm-warn"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" /> {warnUser.isPending ? "ISSUING..." : "ISSUE WARNING"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ===== ANNOUNCE TAB ===== */}
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
                placeholder="Type your announcement here..."
                value={announcement}
                onChange={e => setAnnouncement(e.target.value)}
                className="bg-background/50 min-h-[120px] resize-none focus-visible:ring-primary"
                data-testid="input-announcement"
              />
              <div className="text-xs text-muted-foreground text-right">{announcement.length} chars</div>
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
  const approved = logs?.filter((l: any) => l.status === 'approved').length || 0;
  const total = logs?.length || 0;
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  return (
    <div className="py-3 px-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-display uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" /> {username}'s Submission History
        </div>
        {total > 0 && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span><span className="text-foreground font-medium">{total}</span> total</span>
            <span><span className="text-green-500 font-medium">{approved}</span> approved</span>
            <span><span className={`${approvalRate >= 70 ? 'text-green-500' : approvalRate >= 40 ? 'text-yellow-500' : 'text-destructive'} font-bold`}>{approvalRate}%</span> rate</span>
          </div>
        )}
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
