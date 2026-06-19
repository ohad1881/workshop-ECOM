import apiClient from './client';

// Current user's wishlist (README Appendix B /api/wishlists/*).

export const getMyWishlist = () => apiClient.get('/wishlists/').then((r) => r.data);

export const addWishlistItem = (data) => apiClient.post('/wishlists/', data).then((r) => r.data);

export const updateWishlistItem = (id, data) =>
  apiClient.patch(`/wishlists/${id}/`, data).then((r) => r.data);

export const removeWishlistItem = (id) =>
  apiClient.delete(`/wishlists/${id}/`).then((r) => r.data);
