import apiClient from './client';

// Other users and their public data (see API.md → Users).
// No list-all endpoint by design — discover users via search.

export const searchUsers = (query, limit = 20) =>
  apiClient.get('/users/search/', { params: { q: query, limit } }).then((r) => r.data);

export const getUserProfile = (userId) =>
  apiClient.get(`/users/${userId}/`).then((r) => r.data);

export const getUserPublicWishlist = (userId) =>
  apiClient.get(`/users/${userId}/wishlist/`).then((r) => r.data);
