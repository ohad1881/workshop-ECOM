import apiClient from './client';

// Reference lists (see API.md → Taxonomy). Searched + paginated, never bulk-fetched.
// params: { q, limit, page } — all optional.

export const getCategories = (params) =>
  apiClient.get('/categories/', { params }).then((r) => r.data);

export const getTags = (params) =>
  apiClient.get('/tags/', { params }).then((r) => r.data);
