import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useACoinsLeaderboard, useCreditsLeaderboard } from "@/hooks/use-leaderboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarImage } from "@/lib/avatars";
import { Trophy, Medal, Award } from "lucide-react";

export default function Leaderboard() {
  const { data: aCoinsBoard, isLoading: loadingACoins } = useACoinsLeaderboard();
  const { data: creditsBoard, isLoading: loadingCredits } = useCreditsLeaderboard();

  const renderBoard = (data: any[], resourceType: "A-Coins" | "Credits") => {
    if (!data || data.length === 0) {
      return <div className="text-center p-12 text-muted-foreground border border-dashed border-border/50 rounded-lg">Insufficient data for ranking.</div>;
    }

    return (
      <div className="space-y-3 mt-6">
        {data.map((item, index) => (
          <div key={item.user.id} className="relative overflow-hidden glass-panel rounded-xl p-4 flex items-center gap-4 hover-elevate transition-all duration-300 border border-border/40 hover:border-primary/40 group">
            {index === 0 && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400" />}
            {index === 1 && <div className="absolute top-0 left-0 w-1 h-full bg-slate-300" />}
            {index === 2 && <div className="absolute top-0 left-0 w-1 h-full bg-amber-600" />}
            
            <div className="w-12 text-center flex justify-center">
              {index === 0 ? <Trophy className="h-8 w-8 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" /> :
               index === 1 ? <Medal className="h-7 w-7 text-slate-300" /> :
               index === 2 ? <Award className="h-7 w-7 text-amber-600" /> :
               <span className="font-display text-xl text-muted-foreground font-bold">#{index + 1}</span>}
            </div>

            <Avatar className="h-12 w-12 border-2 border-primary/20 group-hover:border-primary/60 transition-colors">
              <AvatarImage src={getAvatarImage(item.user.avatar) || undefined} alt={item.user.username} />
              <AvatarFallback>{item.user.username.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="font-semibold text-lg flex items-center gap-2">
                {item.user.username}
                {item.user.isDisqualified && <span className="text-[10px] bg-destructive/20 text-destructive border border-destructive/30 px-1.5 py-0.5 rounded uppercase tracking-wider">Disqualified</span>}
              </div>
              <div className="text-xs text-muted-foreground">{item.user.country}</div>
            </div>

            <div className="text-right">
              <div className={`text-2xl font-display font-bold ${resourceType === 'A-Coins' ? 'text-accent' : 'text-primary'}`}>
                +{item.totalApprovedChange.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">{resourceType} Gained</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-foreground text-shadow-glow flex items-center gap-3">
          <Trophy className="h-8 w-8 text-primary" />
          Global Rankings
        </h1>
        <p className="text-muted-foreground mt-1">Compare your performance against top pilots.</p>
      </div>

      <Tabs defaultValue="acoins" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-card border border-border">
          <TabsTrigger value="acoins" className="uppercase font-display tracking-wider data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
            A-Coins Board
          </TabsTrigger>
          <TabsTrigger value="credits" className="uppercase font-display tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            Credits Board
          </TabsTrigger>
        </TabsList>

        <TabsContent value="acoins">
          {loadingACoins ? <div className="p-8 text-center text-muted-foreground">Calculating ranks...</div> : renderBoard(aCoinsBoard || [], "A-Coins")}
        </TabsContent>

        <TabsContent value="credits">
          {loadingCredits ? <div className="p-8 text-center text-muted-foreground">Calculating ranks...</div> : renderBoard(creditsBoard || [], "Credits")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
