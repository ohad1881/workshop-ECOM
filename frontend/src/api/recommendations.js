import apiClient from './client';

// Scoring + knapsack results.
// params typically include { budget, event_type, limit, strategy }.

export const getRecommendations = (userId, params) =>
  apiClient.get(`/recommendations/for-user/${userId}/`, { params }).then((r) => r.data);

export const getBundles = (userId, params) =>
  apiClient.get(`/recommendations/bundle/${userId}/`, { params }).then((r) => r.data);

export const getSelfGiftBundles = (params) =>
  apiClient.get('/recommendations/self-gift/', { params }).then((r) => r.data);
