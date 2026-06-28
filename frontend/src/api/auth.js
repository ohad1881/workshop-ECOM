import apiClient from './client';

// Account & session. Endpoints mirror README Appendix B (/api/auth/*).
// Every function returns parsed response data (callers never touch the axios envelope).

export const register = (email, username, password, passwordConfirm) =>
  apiClient
    .post('/auth/register/', {
      email,
      username,
      password,
      password_confirm: passwordConfirm,
    })
    .then((r) => r.data);

export const loginRequest = (email, password) =>
  apiClient.post('/auth/login/', { email, password }).then((r) => r.data);

export const refreshToken = (refresh) =>
  apiClient.post('/auth/token/refresh/', { refresh }).then((r) => r.data);

export const logout = (refresh) =>
  apiClient.post('/auth/logout/', { refresh }).then((r) => r.data);

export const getCurrentUser = () => apiClient.get('/auth/me/').then((r) => r.data);

// Profile preferences: bio, interest_ids, preferred/excluded_category_ids, privacy flags.
export const updatePreferences = (data) =>
  apiClient.patch('/auth/me/preferences/', data).then((r) => r.data);

export const changePassword = (oldPassword, newPassword) =>
  apiClient
    .post('/auth/change-password/', { old_password: oldPassword, new_password: newPassword })
    .then((r) => r.data);
