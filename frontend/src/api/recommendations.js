import apiClient from './client';

// Scoring + knapsack results.

// Combined gift-builder payload: top-pick recommendations + all three bundles
// from a single scoring pass. params: { budget, event_type, limit }.
// Self-gift is auto-detected server-side when the recipient is the current user.
export const getGiftSuggestions = (userId, params) =>
  apiClient.get(`/recommendations/gift-suggestions/${userId}/`, { params }).then((r) => r.data);
