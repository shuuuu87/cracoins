import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useGlobalStats() {
  return useQuery({
    queryKey: [api.stats.global.path],
    queryFn: async () => {
      const res = await fetch(api.stats.global.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch global stats");
      return api.stats.global.responses[200].parse(await res.json());
    },
  });
}
