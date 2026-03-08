import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useMyLogs() {
  return useQuery({
    queryKey: [api.logs.listMyLogs.path],
    queryFn: async () => {
      const res = await fetch(api.logs.listMyLogs.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return api.logs.listMyLogs.responses[200].parse(await res.json());
    },
  });
}

export function usePendingLogs() {
  return useQuery({
    queryKey: [api.logs.listPending.path],
    queryFn: async () => {
      const res = await fetch(api.logs.listPending.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch pending logs");
      return api.logs.listPending.responses[200].parse(await res.json());
    },
  });
}

export function useSubmitLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(api.logs.create.path, {
        method: api.logs.create.method,
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const err = api.logs.create.responses[400].parse(await res.json());
          throw new Error(err.message);
        }
        throw new Error("Failed to submit log");
      }
      return api.logs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.logs.listMyLogs.path] });
      queryClient.invalidateQueries({ queryKey: [api.logs.listPending.path] });
    },
  });
}

export function useUpdateLogStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: number; status: "pending" | "approved" | "rejected" | "disqualified", adminNotes?: string }) => {
      const url = buildUrl(api.logs.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.logs.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update log status");
      return api.logs.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.logs.listPending.path] });
      queryClient.invalidateQueries({ queryKey: [api.leaderboard.aCoins.path] });
      queryClient.invalidateQueries({ queryKey: [api.leaderboard.credits.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.global.path] });
    },
  });
}
