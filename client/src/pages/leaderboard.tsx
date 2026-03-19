import { useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useACoinsLeaderboard, useCreditsLeaderboard } from "@/hooks/use-leaderboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarImage } from "@/lib/avatars";
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus } from "lucide-react";

const RANK_STORAGE_KEY = "cracoins_prev_ranks";

function RankDelta({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-muted-foreground/40 text-[10px] uppercase font-display tracking-wider">new</span>;
  if (delta === 0) return <Minus className="h-3.5 w-3.5 text-muted-foreground/40" />;
  if (delta > 0) return (
    <span className="flex items-center gap-0.5 text-green-500 text-xs font-bold tabular-nums">
      <TrendingUp className="h-3.5 w-3.5" />+{delta}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-destructive text-xs font-bold tabular-nums">
      <TrendingDown className="h-3.5 w-3.5" />{delta}
    </span>
  );
}

export default function Leaderboard() {
  const { data: aCoinsBoard, isLoading: loadingACoins } = useACoinsLeaderboard();
  const { data: creditsBoard, isLoading: loadingCredits } = useCreditsLeaderboard();
  const [prevRanks, setPrevRanks] = useState<Record<string, number>>({});
  const savedRef = useRef(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RANK_STORAGE_KEY);
      if (stored) setPrevRanks(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    if (savedRef.current || !aCoinsBoard || !creditsBoard) return;
    const timer = setTimeout(() => {
      const newRanks: Record<string, number> = {};
      aCoinsBoard.forEach((item: any, i: number) => { newRanks[`ac_${item.user.id}`] = i + 1; });
      creditsBoard.forEach((item: any, i: number) => { newRanks[`cr_${item.user.id}`] = i + 1; });
      try { localStorage.setItem(RANK_STORAGE_KEY, JSON.stringify(newRanks)); } catch {}
      savedRef.current = true;
    }, 6000);
    return () => clearTimeout(timer);
  }, [aCoinsBoard, creditsBoard]);

  const renderBoard = (data: any[], resourceType: "A-Coins" | "Credits", prefix: "ac" | "cr") => {
    if (!data || data.length === 0) {
      return <div className="text-center p-12 text-muted-foreground border border-dashed border-border/50 rounded-lg">Insufficient data for ranking.</div>;
    }

    return (
      <div className="space-y-3 mt-6">
        {data.map((item, index) => {
          const storageKey = `${prefix}_${item.user.id}`;
          const prevRank = prevRanks[storageKey] ?? null;
          const delta = prevRank !== null ? prevRank - (index + 1) : null;

          return (
            <div
              key={item.user.id}
              className="relative overflow-hidden glass-panel rounded-xl p-4 flex items-center gap-4 hover-elevate transition-all duration-300 border border-border/40 hover:border-primary/40 group"
              data-testid={`row-leaderboard-${item.user.id}`}
            >
              {index === 0 && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400" />}
              {index === 1 && <div className="absolute top-0 left-0 w-1 h-full bg-slate-300" />}
              {index === 2 && <div className="absolute top-0 left-0 w-1 h-full bg-amber-600" />}

              <div className="w-12 text-center flex justify-center flex-shrink-0">
                {index === 0 ? <Trophy className="h-8 w-8 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" /> :
                 index === 1 ? <Medal className="h-7 w-7 text-slate-300" /> :
                 index === 2 ? <Award className="h-7 w-7 text-amber-600" /> :
                 <span className="font-display text-xl text-muted-foreground font-bold">#{index + 1}</span>}
              </div>

              <Avatar className="h-12 w-12 border-2 border-primary/20 group-hover:border-primary/60 transition-colors flex-shrink-0">
                <AvatarImage src={item.user.profileImageUrl || getAvatarImage(item.user.avatar) || undefined} alt={item.user.username} />
                <AvatarFallback>{item.user.username.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-lg flex items-center gap-2 flex-wrap">
                  {item.user.username}
                  {item.user.isDisqualified && (
                    <span className="text-[10px] bg-destructive/20 text-destructive border border-destructive/30 px-1.5 py-0.5 rounded uppercase tracking-wider">Disqualified</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{item.user.country}</div>
              </div>

              <div className="w-12 flex justify-center flex-shrink-0" data-testid={`delta-${prefix}-${item.user.id}`}>
                <RankDelta delta={delta} />
              </div>

              <div className="text-right flex-shrink-0">
                <div className={`text-2xl font-display font-bold ${resourceType === 'A-Coins' ? 'text-accent' : 'text-primary'}`}>
                  +{item.totalApprovedChange.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">{resourceType} Gained</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          Leaderboard
        </h1>
        <p className="text-muted-foreground mt-1">See how you rank against other challengers.</p>
      </div>

      <Tabs defaultValue="acoins" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted/60 rounded-xl p-1">
          <TabsTrigger value="acoins" className="rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-accent">
            A-Coins Board
          </TabsTrigger>
          <TabsTrigger value="credits" className="rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">
            Credits Board
          </TabsTrigger>
        </TabsList>

        <TabsContent value="acoins">
          {loadingACoins
            ? <div className="p-8 text-center text-muted-foreground">Calculating ranks...</div>
            : renderBoard(aCoinsBoard || [], "A-Coins", "ac")}
        </TabsContent>

        <TabsContent value="credits">
          {loadingCredits
            ? <div className="p-8 text-center text-muted-foreground">Calculating ranks...</div>
            : renderBoard(creditsBoard || [], "Credits", "cr")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
