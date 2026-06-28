import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addWishlistItem, updateWishlistItem, removeWishlistItem } from '../api/wishlists';

// Owner-only wishlist mutations. Editing only ever happens on your own profile,
// so the cache key is fixed to the current user's wishlist.
const KEY = ['wishlist', 'me'];

export const useWishlistEditing = () => {
  const qc = useQueryClient();

  const patch = useMutation({
    mutationFn: ({ id, data }) => updateWishlistItem(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData(KEY);
      qc.setQueryData(KEY, (old) =>
        Array.isArray(old) ? old.map((it) => (it.id === id ? { ...it, ...data } : it)) : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(KEY, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const remove = useMutation({
    mutationFn: (id) => removeWishlistItem(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData(KEY);
      qc.setQueryData(KEY, (old) => (Array.isArray(old) ? old.filter((it) => it.id !== id) : old));
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(KEY, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const add = useMutation({
    mutationFn: (data) => addWishlistItem(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  return { patch, remove, add };
};
