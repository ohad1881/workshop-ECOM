import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePreferences } from '../api/auth';

// Owner-only profile edits: bio and category preferences.
export const useProfileEdit = () => {
  const qc = useQueryClient();

  const bio = useMutation({
    mutationFn: (value) => updatePreferences({ bio: value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });

  // Category preferences (interest_ids / preferred_category_ids). The backend
  // replaces the whole list, so callers pass the full new array. Optimistic so
  // chips update instantly.
  const preferences = useMutation({
    mutationFn: (data) => updatePreferences(data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ['me'] });
      const prev = qc.getQueryData(['me']);
      qc.setQueryData(['me'], (old) =>
        old ? { ...old, preferences: { ...old.preferences, ...data } } : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(['me'], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });

  return { bio, preferences };
};
