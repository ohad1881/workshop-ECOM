import apiClient from './client';

export const authAPI = {
  login: (email, password) => {
    return apiClient.post('/auth/token/', { email, password });
  },

  register: (email, username, password) => {
    return apiClient.post('/auth/register/', { email, username, password });
  },

  refreshToken: (refreshToken) => {
    return apiClient.post('/auth/token/refresh/', { refresh: refreshToken });
  },

  logout: () => {
    // Optional: notify backend of logout
    return Promise.resolve();
  },
};

export const usersAPI = {
  getProfile: () => {
    return apiClient.get('/users/me/');
  },

  updateProfile: (data) => {
    return apiClient.patch('/users/me/', data);
  },

  getUserProfile: (userId) => {
    return apiClient.get(`/users/${userId}/`);
  },

  searchUsers: (query) => {
    return apiClient.get('/users/search/', { params: { q: query } });
  },
};

export const metadataAPI = {
  getMetadata: () => {
    return apiClient.get('/metadata/');
  },
};
