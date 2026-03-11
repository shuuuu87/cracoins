import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Trophy, Upload, AlertCircle } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  const [currentTab, setCurrentTab] = useState("overview");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display uppercase tracking-widest">
            Welcome to Mech Arena Challenge
          </DialogTitle>
          <DialogDescription>
            Learn the rules and how to use the platform
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="howto">How to Use</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="glass-panel border-primary/20">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <h3 className="font-display font-bold text-lg uppercase tracking-wider">Challenge Duration</h3>
                  <p className="text-sm text-muted-foreground">
                    April 24, 2026 – August 24, 2026 (4 Months)
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-display font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-accent" />
                    Challenge Goal
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Track your in-game A-Coins and Credits while maintaining daily submissions. Accumulate the most resources without spending money in the Mech Arena game.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-display font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    No Spending Rule
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You cannot spend REAL MONEY on A-Coins or Credits. Only in-game earned resources count!
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-display font-bold text-lg uppercase tracking-wider">Key Metrics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/30 rounded border border-border/50">
                      <div className="text-xs text-muted-foreground uppercase font-semibold">A-Coins</div>
                      <div className="text-sm font-display text-accent mt-1">Premium Currency</div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded border border-border/50">
                      <div className="text-xs text-muted-foreground uppercase font-semibold">Credits</div>
                      <div className="text-sm font-display text-primary mt-1">In-Game Currency</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <Card className="glass-panel border-destructive/20">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <h3 className="font-display font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    General Rules
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>Challenge runs from April 24 – August 24, 2026</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>You must play WITHOUT spending real money</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>Daily submissions are required to stay active</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>All submissions require a screenshot for verification</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-display font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    Disqualification
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-destructive font-bold">✕</span>
                      <span>Spending REAL MONEY on A-Coins or Credits = DISQUALIFIED</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-destructive font-bold">✕</span>
                      <span>Submitting false or manipulated screenshots</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-destructive font-bold">✕</span>
                      <span>Exceeding 3 consecutive days without submission</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-display font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-accent" />
                    Leaderboard
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Rankings are based on total approved A-Coins and Credits. Updated daily at UTC midnight.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="howto" className="space-y-4">
            <Card className="glass-panel border-primary/20">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <h3 className="font-display font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Daily Submission Process
                  </h3>
                  <ol className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="font-display font-bold text-primary min-w-6">1.</span>
                      <span>Take a screenshot of your current A-Coins and Credits in Mech Arena</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-display font-bold text-primary min-w-6">2.</span>
                      <span>Go to the Dashboard → Daily Submission section</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-display font-bold text-primary min-w-6">3.</span>
                      <span>Enter your current A-Coins and Credits amounts</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-display font-bold text-primary min-w-6">4.</span>
                      <span>Upload your screenshot (JPG, PNG, or GIF format)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-display font-bold text-primary min-w-6">5.</span>
                      <span>Submit for admin review. Status: Pending → Approved/Rejected</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-muted/20 p-3 rounded border border-border/50">
                  <p className="text-xs text-muted-foreground">
                    <strong>⏰ Important:</strong> Each day resets at 12:00 AM in your timezone. You can only submit once per day. If rejected, you can resubmit until approved.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-display font-bold text-lg uppercase tracking-wider">Dashboard Features</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-primary font-bold">→</span>
                      <span><strong>Countdown Timer:</strong> Shows when protocol starts/ends</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary font-bold">→</span>
                      <span><strong>Resource Trajectory:</strong> Chart your A-Coins and Credits growth</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary font-bold">→</span>
                      <span><strong>Submission History:</strong> View all your past submissions</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary font-bold">→</span>
                      <span><strong>Leaderboard:</strong> Compete with other players</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-display font-bold text-lg uppercase tracking-wider">Profile Settings</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-primary font-bold">→</span>
                      <span>Update your avatar and display name</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary font-bold">→</span>
                      <span>Select your country for timezone-accurate submissions</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={onClose} className="font-display uppercase tracking-wider">
            Got It, Let's Go!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
