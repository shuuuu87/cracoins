import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Message } from "@shared/schema";

export function useMyMessages() {
  return useQuery<Message[]>({
    queryKey: ['/api/messages'],
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiRequest('POST', '/api/messages', { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/messages'] });
    },
  });
}

export function useMarkMessagesRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest('PATCH', '/api/messages/read', {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/messages'] });
      qc.invalidateQueries({ queryKey: ['/api/messages/unread-count'] });
    },
  });
}

export function useUnreadMessageCount() {
  return useQuery<{ count: number }>({
    queryKey: ['/api/messages/unread-count'],
    refetchInterval: 30000,
  });
}

export function useAdminConversations() {
  return useQuery<any[]>({
    queryKey: ['/api/admin/messages'],
  });
}

export function useAdminUserMessages(userId: number | null) {
  return useQuery<Message[]>({
    queryKey: ['/api/admin/messages', userId],
    enabled: userId !== null,
  });
}

export function useAdminReply(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiRequest('POST', `/api/admin/messages/${userId}`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/admin/messages', userId] });
      qc.invalidateQueries({ queryKey: ['/api/admin/messages'] });
    },
  });
}

export function useAdminMarkRead(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest('PATCH', `/api/admin/messages/${userId}/read`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/admin/messages'] });
      qc.invalidateQueries({ queryKey: ['/api/admin/messages', userId] });
    },
  });
}
