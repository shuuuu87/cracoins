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
    refetchInterval: 20_000,
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
    refetchInterval: 30000,
  });
}

export function useAllAdminLogs(filters?: { userId?: number; status?: string }) {
  const params = new URLSearchParams();
  if (filters?.userId) params.set('userId', String(filters.userId));
  if (filters?.status) params.set('status', filters.status);
  const queryString = params.toString();

  return useQuery({
    queryKey: ['/api/admin/logs', filters],
    queryFn: async () => {
      const res = await fetch(`/api/admin/logs${queryString ? '?' + queryString : ''}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json() as Promise<any[]>;
    },
    refetchInterval: 30_000,
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/logs'] });
      queryClient.invalidateQueries({ queryKey: [api.leaderboard.aCoins.path] });
      queryClient.invalidateQueries({ queryKey: [api.leaderboard.credits.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.global.path] });
      queryClient.invalidateQueries({ queryKey: [api.activities.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.logs.listMyLogs.path] });
    },
  });
}

export function useBatchUpdateLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, status }: { ids: number[]; status: 'approved' | 'rejected' }) => {
      const res = await fetch('/api/admin/logs/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to batch update logs");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.logs.listPending.path] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/logs'] });
      queryClient.invalidateQueries({ queryKey: [api.leaderboard.aCoins.path] });
      queryClient.invalidateQueries({ queryKey: [api.leaderboard.credits.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.global.path] });
      queryClient.invalidateQueries({ queryKey: [api.activities.list.path] });
    },
  });
}
