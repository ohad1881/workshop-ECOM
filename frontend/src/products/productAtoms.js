import { atomWithStorage } from 'jotai/utils';

// Products page "Show in Wishlist" toggle. Persisted to localStorage so the
// user's preference survives reloads. Defaults to false: wishlist items are
// hidden (show everything BUT the wishlist). When true, they're shown too.
export const showWishlistItemsAtom = atomWithStorage('products:showWishlistItems', false);
