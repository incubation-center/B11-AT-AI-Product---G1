import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getTelegramLinkStatus,
  generateTelegramLinkCode,
} from '@/lib/auth';

export const telegramKeys = {
  all: ['telegram'] as const,
  status: () => [...telegramKeys.all, 'status'] as const,
};

export function useTelegramLinkStatus() {
  return useQuery({
    queryKey: telegramKeys.status(),
    queryFn: getTelegramLinkStatus,
  });
}

export function useGenerateTelegramCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateTelegramLinkCode,
    onSuccess: () => {
      // Invalidate the telegram status query to refresh it
      queryClient.invalidateQueries({ queryKey: telegramKeys.status() });
    },
  });
}
