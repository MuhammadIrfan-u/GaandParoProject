const API_BASE = 'http://localhost:3000/api/admin';

const getAuthToken = () => localStorage.getItem('auth_token');

const apiFetch = async (path: string, init?: RequestInit) => {
  const authToken = getAuthToken();
  const url = `${API_BASE}${path}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    ...init,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.error || errorBody.message || `API request failed: ${response.status} ${response.statusText}`;
    throw new Error(message);
  }
  return response.json();
};

export const adminService = {
  getDashboardData: async (neighborhoodId: string | number) => {
    return await apiFetch(`/dashboard/${neighborhoodId}`);
  },

  deletePost: async (id: string) => {
    return await apiFetch(`/posts/${id}`, { method: 'DELETE' });
  },

  deleteEvent: async (id: string) => {
    return await apiFetch(`/events/${id}`, { method: 'DELETE' });
  },

  deleteAlert: async (id: string) => {
    return await apiFetch(`/alerts/${id}`, { method: 'DELETE' });
  },

  deleteMarketItem: async (id: string) => {
    return await apiFetch(`/marketplace/${id}`, { method: 'DELETE' });
  },

  editPost: async (id: string, content: string) => {
    return await apiFetch(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
  },

  editEvent: async (id: string, data: { title: string; description: string; date: string; time: string }) => {
    return await apiFetch(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  editAlert: async (id: string, data: { title: string; description: string; severity: string }) => {
    return await apiFetch(`/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  editMarketItem: async (id: string, data: { title: string; description: string; price: number }) => {
    return await apiFetch(`/marketplace/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  updateApplicationStatus: async (id: string, status: 'approved' | 'rejected') => {
    return await apiFetch(`/applications/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  updateSettings: async (neighborhoodId: string | number, settings: any) => {
    return await apiFetch(`/neighborhood/${neighborhoodId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }
};