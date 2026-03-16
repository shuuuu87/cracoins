import { useQuery } from "@tanstack/react-query";
import { Coins, Zap } from "lucide-react";
import { getAvatarImage } from "@/lib/avatars";

type LeaderboardEntry = {
  user: {
    id: number;
    username: string;
    avatar: string;
    country: string;
    isDisqualified: boolean;
  };
  totalApprovedChange: number;
};

export default function ProtocolEnded() {
  const { data: aCoinsBoard } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard/a-coins"],
  });
  const { data: creditsBoard } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard/credits"],
  });

  // Build merged player map
  const players = (() => {
    const map = new Map<number, {
      username: string;
      avatar: string;
      country: string;
      isDisqualified: boolean;
      aCoins: number;
      credits: number;
    }>();

    aCoinsBoard?.forEach(e => {
      map.set(e.user.id, {
        username: e.user.username,
        avatar: e.user.avatar,
        country: e.user.country,
        isDisqualified: e.user.isDisqualified,
        aCoins: e.totalApprovedChange,
        credits: 0,
      });
    });

    creditsBoard?.forEach(e => {
      if (map.has(e.user.id)) {
        map.get(e.user.id)!.credits = e.totalApprovedChange;
      } else {
        map.set(e.user.id, {
          username: e.user.username,
          avatar: e.user.avatar,
          country: e.user.country,
          isDisqualified: e.user.isDisqualified,
          aCoins: 0,
          credits: e.totalApprovedChange,
        });
      }
    });

    return Array.from(map.values());
  })();

  // Separate winners
  const aCoinsWinner = [...players].sort((a, b) => b.aCoins - a.aCoins)[0];
  const creditsWinner = [...players].sort((a, b) => b.credits - a.credits)[0];

  // Full standings sorted by total
  const standings = [...players].sort((a, b) => (b.aCoins + b.credits) - (a.aCoins + a.credits));
  const medals = ["🥇", "🥈", "🥉"];

  const WinnerCard = ({
    winner,
    type,
    label,
    icon,
    color,
  }: {
    winner: typeof aCoinsWinner;
    type: "acoins" | "credits";
    label: string;
    icon: React.ReactNode;
    color: string;
  }) => (
    <div className={`glass-panel rounded-2xl border-2 p-6 flex flex-col items-center gap-3 text-center ${color}`}>
      <div className="text-4xl">👑</div>
      <div className="text-xs uppercase tracking-widest font-display text-muted-foreground">{label} Champion</div>
      {winner ? (
        <>
          <img
            src={getAvatarImage(winner.avatar) || ""}
            alt={winner.username}
            className="h-20 w-20 rounded-full object-cover border-4 border-current shadow-lg"
          />
          <div className="font-display font-bold text-xl text-foreground">{winner.username}</div>
          <div className="text-xs text-muted-foreground">{winner.country}</div>
          <div className={`flex items-center gap-2 text-2xl font-display font-bold`}>
            {icon}
            <span>{(type === "acoins" ? winner.aCoins : winner.credits).toLocaleString()}</span>
          </div>
        </>
      ) : (
        <div className="text-muted-foreground text-sm">Loading…</div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-12 overflow-y-auto">
      {/* Background glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent/5 blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-3xl space-y-10">

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="text-6xl mb-2">🏆</div>
          <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-widest text-primary">
            Challenge Complete!
          </h1>
          <p className="text-lg text-muted-foreground">
            The No-Spend Protocol has ended. Amazing effort, Pilots!
          </p>
        </div>

        {/* Farewell message */}
        <div className="glass-panel rounded-2xl border border-primary/20 p-6 text-center space-y-3">
          <p className="text-xl font-display tracking-wide text-foreground">
            Greetings to all Mech Arena Warriors! 🎉
          </p>
          <p className="text-muted-foreground leading-relaxed">
            You survived 4 months without spending a single coin. That takes real discipline.
            Whether you topped the board or just made it through — you earned it.
          </p>
          <p className="text-primary font-semibold text-lg font-display tracking-wider mt-2">
            Happy Journey, Pilots. You are now free to use your resources! 🚀
          </p>
        </div>

        {/* Two Champions */}
        <div className="space-y-3">
          <h2 className="text-xl font-display uppercase tracking-widest text-center text-muted-foreground">
            Challenge Champions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <WinnerCard
              winner={aCoinsWinner}
              type="acoins"
              label="A-Coins"
              icon={<Zap className="h-6 w-6 text-accent" />}
              color="border-accent/40"
            />
            <WinnerCard
              winner={creditsWinner}
              type="credits"
              label="Credits"
              icon={<Coins className="h-6 w-6 text-primary" />}
              color="border-primary/40"
            />
          </div>
        </div>

        {/* Full Standings */}
        <div className="space-y-4">
          <h2 className="text-xl font-display uppercase tracking-widest text-center text-muted-foreground">
            Final Standings
          </h2>

          <div className="space-y-3">
            {standings.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">Loading results...</div>
            ) : (
              standings.map((p, i) => (
                <div
                  key={p.username}
                  data-testid={`player-row-${i}`}
                  className={`glass-panel rounded-xl border p-4 flex items-center gap-4 transition-all
                    ${i === 0 ? 'border-yellow-400/40 bg-yellow-400/5' :
                      i === 1 ? 'border-slate-300/30 bg-slate-300/5' :
                      i === 2 ? 'border-amber-600/30 bg-amber-600/5' :
                      'border-border/30'}`}
                >
                  <div className="text-2xl w-8 text-center shrink-0">
                    {i < 3 ? medals[i] : <span className="text-muted-foreground text-sm font-display">#{i + 1}</span>}
                  </div>

                  <img
                    src={getAvatarImage(p.avatar) || ""}
                    alt={p.username}
                    className="h-12 w-12 rounded-full object-cover border-2 border-border/50 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-foreground truncate flex items-center gap-2">
                      {p.username}
                      {p.username === aCoinsWinner?.username && (
                        <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded font-sans">⚡ A-Coins Champ</span>
                      )}
                      {p.username === creditsWinner?.username && p.username !== aCoinsWinner?.username && (
                        <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-sans">💰 Credits Champ</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{p.country}</div>
                    {p.isDisqualified && (
                      <div className="text-xs text-destructive font-semibold uppercase">Disqualified</div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1 text-sm font-display text-accent">
                      <Zap className="h-3 w-3" />
                      <span>{p.aCoins.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-display text-primary">
                      <Coins className="h-3 w-3" />
                      <span>{p.credits.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 text-xs text-muted-foreground pb-8">
          <div className="flex items-center gap-1"><Zap className="h-3 w-3 text-accent" /> A-Coins earned</div>
          <div className="flex items-center gap-1"><Coins className="h-3 w-3 text-primary" /> Credits earned</div>
        </div>

      </div>
    </div>
  );
}
