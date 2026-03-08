import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useActivities() {
  return useQuery({
    queryKey: [api.activities.list.path],
    queryFn: async () => {
      const res = await fetch(api.activities.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch activities");
      return api.activities.list.responses[200].parse(await res.json());
    },
    refetchInterval: 30000, // Refresh every 30s
  });
}
