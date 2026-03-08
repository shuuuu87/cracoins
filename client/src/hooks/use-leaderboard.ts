import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useACoinsLeaderboard() {
  return useQuery({
    queryKey: [api.leaderboard.aCoins.path],
    queryFn: async () => {
      const res = await fetch(api.leaderboard.aCoins.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch A-Coins leaderboard");
      return api.leaderboard.aCoins.responses[200].parse(await res.json());
    },
  });
}

export function useCreditsLeaderboard() {
  return useQuery({
    queryKey: [api.leaderboard.credits.path],
    queryFn: async () => {
      const res = await fetch(api.leaderboard.credits.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch Credits leaderboard");
      return api.leaderboard.credits.responses[200].parse(await res.json());
    },
  });
}
