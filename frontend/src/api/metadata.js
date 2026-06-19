import apiClient from './client';

// App constants that are kept in backend: event types + gift strategies (currently)
export const getMetadata = () => apiClient.get('/metadata/').then((r) => r.data);
