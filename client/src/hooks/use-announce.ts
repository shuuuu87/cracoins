import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useAnnounce() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch('/api/admin/announce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.activities.list.path] });
    },
  });
}
