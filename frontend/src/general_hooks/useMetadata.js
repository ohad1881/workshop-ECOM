import { useQuery } from '@tanstack/react-query';
import { getMetadata } from '../api/metadata';

// Loads backend app constants (event types, gift strategies) and caches them.
// Shared by gift-builder and chat, so it lives in general_hooks.
export const useMetadata = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['metadata'],
    queryFn: getMetadata,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    eventTypes: data?.event_types || [],
    giftStrategies: data?.gift_strategies || [],
    isLoading,
    error,
  };
};
