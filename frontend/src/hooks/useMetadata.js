import { useQuery } from '@tanstack/react-query';
import { metadataAPI } from '../api';

export const useMetadata = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['metadata'],
    queryFn: () => metadataAPI.getMetadata().then((res) => res.data),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    eventTypes: data?.event_types || [],
    giftStrategies: data?.gift_strategies || [],
    isLoading,
    error,
  };
};
