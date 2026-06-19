import apiClient from './client';

// Product catalog (README Appendix B /api/products/*).

export const listProducts = (params) => apiClient.get('/products/', { params }).then((r) => r.data);

export const getProduct = (id) => apiClient.get(`/products/${id}/`).then((r) => r.data);

export const searchProducts = (query) =>
  apiClient.get('/products/search/', { params: { q: query } }).then((r) => r.data);
