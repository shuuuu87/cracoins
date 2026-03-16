import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useUsers() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return api.users.list.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, role }: { id: number; role: "user" | "admin" }) => {
      const url = buildUrl(api.users.updateRole.path, { id });
      const res = await fetch(url, {
        method: api.users.updateRole.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update role");
      return api.users.updateRole.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
    },
  });
}

export function useReinstateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/users/${id}/reinstate`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to reinstate user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.activities.list.path] });
    },
  });
}

export function useUpdateStartingValues() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, startACoins, startCredits }: { id: number; startACoins: number; startCredits: number }) => {
      const res = await fetch(`/api/admin/users/${id}/starting-values`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startACoins, startCredits }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to update starting values");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
    },
  });
}

export function useDisqualifyUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const res = await fetch(`/api/admin/users/${id}/disqualify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to disqualify user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.activities.list.path] });
    },
  });
}

export function useWarnUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await fetch(`/api/admin/users/${id}/warn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to warn user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.activities.list.path] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to delete user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
    },
  });
}

export function useUserLogs(userId: number) {
  return useQuery({
    queryKey: ['/api/admin/users', userId, 'logs'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/logs`, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch user logs");
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useUserAdminStats(userId: number) {
  return useQuery({
    queryKey: ['/api/admin/users', userId, 'stats'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/stats`, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch user stats");
      return res.json() as Promise<{ total: number; approved: number; rejected: number; pending: number; approvalRate: number }>;
    },
    enabled: !!userId,
  });
}

export function useMyStats() {
  return useQuery({
    queryKey: ['/api/users/me/stats'],
    queryFn: async () => {
      const res = await fetch('/api/users/me/stats', { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json() as Promise<{
        totalSubmissions: number;
        approved: number;
        rejected: number;
        pending: number;
        totalACoinsEarned: number;
        totalCreditsEarned: number;
      }>;
    },
  });
}
