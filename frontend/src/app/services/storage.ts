// Local Storage Service
// This simulates a backend with persistent local storage

import type {
  Post,
  MarketplaceItem,
  Event,
  Alert,
  Conversation,
  Message,
  Notification,
  ServiceRequest,
  Service,
  User,
  Review,
  Neighborhood,
  NeighborhoodProposal,
  NeighborhoodSettings,
  AnalyticsData,
  ProviderApplication,
} from './types';

const API_BASE = 'http://localhost:3000';


const getAuthToken = () => localStorage.getItem('auth_token');

const apiFetch = async (path: string, init?: RequestInit) => {
  const authToken = getAuthToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  return response;
};

const apiGet = async <T>(path: string): Promise<T> => {
  const response = await apiFetch(path);
  return response.json();
};

// Initialize data from localStorage or use defaults
const getStoredData = <T,>(key: string, defaultData: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultData;
  } catch {
    return defaultData;
  }
};

const setStoredData = <T,>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to store data:', error);
  }
};

// Data stores for incremental local updates
let postsStore: Post[] = getStoredData('neighborhub_posts', []);
let marketplaceStore: MarketplaceItem[] = getStoredData('neighborhub_marketplace', []);
let eventsStore: Event[] = getStoredData('neighborhub_events', []);
let alertsStore: Alert[] = getStoredData('neighborhub_alerts', []);
let conversationsStore: Conversation[] = getStoredData('neighborhub_conversations', []);
let messagesStore: { [conversationId: string]: Message[] } = getStoredData('neighborhub_messages', {});
let notificationsStore: Notification[] = getStoredData('neighborhub_notifications', []);
let serviceRequestsStore: ServiceRequest[] = getStoredData('neighborhub_service_requests', []);
let reviewsStore: Review[] = getStoredData('neighborhub_reviews', []);
let neighborhoodsStore: Neighborhood[] = getStoredData('neighborhub_neighborhoods', []);
let proposalsStore: NeighborhoodProposal[] = getStoredData('neighborhub_proposals', []);
let locationStore = getStoredData('neighborhub_location', { lat: 0, lng: 0 });
let servicesStore: Service[] = getStoredData('neighborhub_services', []);
let serviceOverridesStore: { [id: string]: Partial<Service> } = getStoredData('neighborhub_service_overrides', {});
let providerApplicationsStore: ProviderApplication[] = getStoredData('neighborhub_provider_applications', []);

// Auth State
const localCurrentUser: User = {
  id: '42', // Changed to numeric string to match DB integer
  name: 'Alex Thompson',
  email: 'alex.thompson@email.com',
  phone: '+1 (555) 123-4567',
  address: '123 Oak Street, Oak Valley',
  avatar: 'AT',
  verified: true,
  reputation: 4.8,
  joinedDate: '2024-01-15',
  bio: 'Long-time resident of Oak Valley. Love our community!',
  isAdmin: true,
  isProvider: true,
  neighborhoodId: 11, // Reset to 1 for standard test data
};

let authUser: User = localCurrentUser;
let isAuthenticated = false;

// Auth Service
export const authService = {
  syncUser: async (user: User) => {
    try {
      const response = await apiFetch('/users/upsert', {
        method: 'POST',
        body: JSON.stringify(user)
      });
      return response.json();
    } catch (error) {
      console.error('Error syncing user:', error);
      return user;
    }
  },

  signup: async (formData: any) => {
    const response = await apiFetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    const data = await response.json();
    if (data.success) {
      isAuthenticated = true;
      authUser = data.user;
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_id', String(data.user.id));
      localStorage.setItem('user_name', data.user.name);
      localStorage.setItem('user_email', data.user.email);
      localStorage.setItem('is_admin', String(data.user.is_admin));
    }
    return data;
  },

  login: async (email: string, password: string) => {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  verifyOtp: async (email: string, otp: string) => {
    const response = await apiFetch('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
    const data = await response.json();
    if (data.success) {
      isAuthenticated = true;
      authUser = data.user;
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_id', String(data.user.id));
      localStorage.setItem('user_name', data.user.name);
      localStorage.setItem('user_email', data.user.email);
      localStorage.setItem('is_admin', String(data.user.is_admin));
    }
    return data;
  },

  resendOtp: async (email: string) => {
    const response = await apiFetch('/api/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    return response.json();
  },

  logout: () => {
    isAuthenticated = false;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    localStorage.removeItem('is_admin');
  },

  getCurrentUser: () => authUser,

  isAuthenticated: () => isAuthenticated || !!localStorage.getItem('auth_token'),

  updateProfile: async (updates: Partial<User>) => {
    authUser = { ...authUser, ...updates };
    await authService.syncUser(authUser);
    return authUser;
  },
};

// Posts Service
export const postsService = {
  getPosts: async (neighborhoodId?: string | number) => {
    try {
      const user = authService.getCurrentUser();
      const nId = neighborhoodId || user.neighborhoodId;
      const posts = await apiGet<Post[]>(`/posts?neighborhoodId=${nId}`);
      return posts;
    } catch (error) {
      console.error('Error fetching posts:', error);
      return postsStore;
    }
  },

  getPost: async (id: string) => {
    try {
      const post = await apiGet<Post>(`/posts/${encodeURIComponent(id)}`);
      return post;
    } catch (error) {
      console.error('Error fetching post:', error);
      return postsStore.find(p => p.id === id);
    }
  },

  createPost: async (content: string, category: string) => {
    try {
      const response = await apiFetch('/posts', {
        method: 'POST',
        body: JSON.stringify({
          authorId: authUser.id,
          neighborhoodId: authUser.neighborhoodId,
          content,
          category
        })
      });
      return response.json();
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  updatePost: async (postId: string, content: string, category: string) => {
    try {
      const response = await apiFetch(`/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify({
          authorId: authUser.id,
          content,
          category
        })
      });
      return response.json();
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  likePost: (postId: string) => {
    const post = postsStore.find(p => p.id === postId);
    if (post) {
      const index = post.likedBy.indexOf(authUser.id);
      if (index > -1) {
        post.likedBy.splice(index, 1);
        post.likes--;
      } else {
        post.likedBy.push(authUser.id);
        post.likes++;
      }
      setStoredData('neighborhub_posts', postsStore);
    }
    return Promise.resolve(post);
  },

  addComment: async (postId: string, content: string) => {
    try {
      const response = await apiFetch(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          authorId: authUser.id,
          content
        })
      });
      return response.json();
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  deletePost: async (postId: string) => {
    try {
      await apiFetch(`/posts/${postId}?authorId=${authUser.id}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },
};

// Marketplace Service
export const marketplaceService = {
  getItems: async () => {
    try {
      const items = await apiGet<MarketplaceItem[]>('/api/marketplace');
      return items;
    } catch (error) {
      console.error('Error fetching marketplace listings:', error);
      return marketplaceStore;
    }
  },

  getItem: async (id: string) => {
    try {
      const item = await apiGet<MarketplaceItem>(`/api/marketplace/${encodeURIComponent(id)}`);
      return item;
    } catch (error) {
      console.error('Error fetching listing:', error);
      return marketplaceStore.find(i => i.id === id);
    }
  },

  createItem: async (item: Omit<MarketplaceItem, 'id' | 'sellerId' | 'seller' | 'sellerAvatar' | 'verified' | 'postedDate' | 'status'>): Promise<MarketplaceItem> => {
    try {
      const user = authService.getCurrentUser();
      const response = await apiFetch('/api/marketplace', {
        method: 'POST',
        body: JSON.stringify({
          ...item,
          sellerId: user.id
        })
      });
      return response.json();
    } catch (error) {
      console.error('Error creating marketplace item:', error);
      throw error;
    }
  },

  updateItem: async (id: string, updates: Partial<MarketplaceItem>) => {
    try {
      const user = authService.getCurrentUser();
      const response = await apiFetch(`/api/marketplace/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...updates,
          sellerId: user.id
        })
      });
      return response.json();
    } catch (error) {
      console.error('Error updating marketplace item:', error);
      throw error;
    }
  },

  deleteItem: async (itemId: string) => {
    try {
      const user = authService.getCurrentUser();
      await apiFetch(`/api/marketplace/${itemId}?sellerId=${user.id}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Error deleting marketplace item:', error);
      throw error;
    }
  },
};
// Events Service
export const eventsService = {
  getEvents: async (neighborhoodId?: string | number) => {
    try {
      const url = neighborhoodId ? `/events?neighborhoodId=${neighborhoodId}` : '/events';
      const events = await apiGet<Event[]>(url);
      return events;
    } catch (error) {
      console.error('Error fetching events:', error);
      return eventsStore;
    }
  },

  getEvent: async (id: string) => {
    try {
      const event = await apiGet<Event>(`/events/${encodeURIComponent(id)}`);
      return event;
    } catch (error) {
      console.error('Error fetching event:', error);
      return eventsStore.find(e => e.id === id);
    }
  },

  createEvent: async (event: Omit<Event, 'id' | 'organizerId' | 'organizer' | 'organizerAvatar' | 'attendees'>) => {
    try {
      const user = authService.getCurrentUser();
      const payload = {
        ...event,
        organizerId: user.id,
        neighborhoodId: user.neighborhoodId
      };

      const response = await apiFetch('/events', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return response.json();
    } catch (error) {
      console.error('Error creating event:', error);
      // Fallback
      const newEvent: Event = {
        ...event,
        id: `event-${Date.now()}`,
        organizerId: authUser.id,
        organizer: authUser.name,
        organizerAvatar: authUser.avatar,
        attendees: [authUser.id],
      };
      eventsStore = [newEvent, ...eventsStore];
      setStoredData('neighborhub_events', eventsStore);
      return newEvent;
    }
  },

  updateEvent: async (id: string, updates: Partial<Event>) => {
    try {
      const user = authService.getCurrentUser();
      const response = await apiFetch(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...updates, userId: user.id })
      });
      return response.json();
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  rsvpEvent: async (eventId: string) => {
    try {
      const user = authService.getCurrentUser();
      const response = await apiFetch(`/events/${eventId}/rsvp`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id })
      });
      return response.json();
    } catch (error) {
      console.error('Error RSVing to event:', error);
      // Fallback
      const event = eventsStore.find(e => e.id === eventId);
      if (event) {
        const index = event.attendees.indexOf(authUser.id);
        if (index > -1) {
          event.attendees.splice(index, 1);
        } else {
          if (!event.maxAttendees || event.attendees.length < event.maxAttendees) {
            event.attendees.push(authUser.id);
          }
        }
        setStoredData('neighborhub_events', eventsStore);
      }
      return event;
    }
  },

  deleteEvent: async (eventId: string) => {
    try {
      const user = authService.getCurrentUser();
      await apiFetch(`/events/${eventId}?userId=${user.id}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      // Fallback
      eventsStore = eventsStore.filter(e => e.id !== eventId);
      setStoredData('neighborhub_events', eventsStore);
      return true;
    }
  },
};

// Alerts Service
export const alertsService = {
  getAlerts: async () => {
    try {
      const alerts = await apiGet<Alert[]>('/alerts');
      return alerts;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return alertsStore;
    }
  },

  createAlert: async (alert: Omit<Alert, 'id' | 'authorId' | 'author' | 'timestamp' | 'resolved'>) => {
    try {
      const response = await apiFetch('/alerts', {
        method: 'POST',
        body: JSON.stringify({
          ...alert,
          authorId: authUser.id
        })
      });
      return response.json();
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  },

  resolveAlert: async (alertId: string) => {
    try {
      const response = await apiFetch(`/alerts/${alertId}`, {
        method: 'PUT',
        body: JSON.stringify({ resolved: true })
      });
      return response.json();
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  },

  deleteAlert: async (alertId: string) => {
    try {
      await apiFetch(`/alerts/${alertId}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Error deleting alert:', error);
      throw error;
    }
  },

  getOrCreateConversation: async (providerId: string, providerName: string, providerAvatar: string) => {
    const response = await apiFetch('/conversations/get-or-create', {
      method: 'POST',
      body: JSON.stringify({ participantId: providerId })
    });
    return response.json();
  },
};


// Notifications Service
export const notificationsService = {
  getNotifications: async () => {
    try {
      const notifications = await apiGet<Notification[]>(`/notifications?userId=${authUser.id}`);
      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return notificationsStore;
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const response = await apiFetch(`/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      return response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      await apiFetch('/notifications/read-all', {
        method: 'POST',
        body: JSON.stringify({ userId: authUser.id })
      });
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },
};

// Analytics Service
export const analyticsService = {
  getAnalytics: async () => {
    const analytics = await apiGet<AnalyticsData>('/analytics');
    return analytics;
  },
};

// Services Service
export const servicesService = {
  getServices: async () => {
    try {
      const user = authService.getCurrentUser();
      const nId = user.neighborhoodId || 1;
      const backendServices = await apiGet<Service[]>(`/services?neighborhoodId=${nId}`);
      // Merge backend services with overrides
      const mergedBackend = backendServices.map(s => ({
        ...s,
        ...(serviceOverridesStore[s.id] || {})
      }));
      return [...servicesStore, ...mergedBackend];
    } catch (error) {
      console.error('Error fetching services:', error);
      return servicesStore;
    }
  },

  getService: async (id: string) => {
    // Check local store first
    let service = servicesStore.find(s => s.id === id);

    if (!service) {
      try {
        service = await apiGet<Service>(`/services/${encodeURIComponent(id)}`);
      } catch (error) {
        return null;
      }
    }

    if (service) {
      // Apply overrides if any
      return { ...service, ...(serviceOverridesStore[id] || {}) };
    }

    return null;
  },

  requestService: async (serviceId: string, description: string, scheduledDate?: string) => {
    try {
      const response = await apiFetch('/service-requests', {
        method: 'POST',
        body: JSON.stringify({ userId: authUser.id, serviceId, description, scheduledDate })
      });
      return response.json();
    } catch (error) {
      console.error('Error requesting service:', error);
      const service = servicesStore.find(s => s.id === serviceId) || { title: 'Unknown', provider: 'Unknown' };
      const newRequest: ServiceRequest = {
        id: `req-${Date.now()}`,
        userId: authUser.id,
        serviceId,
        serviceName: service.title,
        provider: service.provider,
        status: 'pending',
        requestDate: new Date().toISOString().split('T')[0],
        scheduledDate,
        description,
      };

      serviceRequestsStore = [newRequest, ...serviceRequestsStore];
      setStoredData('neighborhub_service_requests', serviceRequestsStore);
      return newRequest;
    }
  },

  getMyRequests: async () => {
    try {
      return await apiGet<ServiceRequest[]>(`/service-requests?userId=${authUser.id}`);
    } catch (error) {
      return serviceRequestsStore.filter(r => r.userId === authUser.id);
    }
  },

  getProviderRequests: async (providerId: string | number) => {
    try {
      return await apiGet<ServiceRequest[]>(`/service-requests?providerId=${providerId}`);
    } catch (error) {
      console.error('Error fetching provider requests:', error);
      return serviceRequestsStore.filter(r => String(r.providerId) === String(providerId));
    }
  },

  updateRequestStatus: async (requestId: string | number, status: ServiceRequest['status']) => {
    try {
      const response = await apiFetch(`/service-requests/${requestId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      return response.json();
    } catch (error) {
      console.error('Error updating request status:', error);
      const request = serviceRequestsStore.find(r => String(r.id) === String(requestId));
      if (request) {
        request.status = status;
        setStoredData('neighborhub_service_requests', serviceRequestsStore);
      }
      return request;
    }
  },

  createService: async (service: any) => {
    try {
      const response = await apiFetch('/services', {
        method: 'POST',
        body: JSON.stringify({
          ...service,
          providerId: authUser.id,
          neighborhoodId: authUser.neighborhoodId || 1,
        })
      });
      return response.json();
    } catch (error) {
      console.error('Error creating service:', error);
      const newService: Service = {
        ...service,
        id: `service-${Date.now()}`,
        provider: authUser.name,
        providerAvatar: authUser.avatar,
        verified: authUser.verified,
        rating: 5.0,
        reviews: 0,
        status: 'active',
        price: typeof service.price === 'string' && service.price.startsWith('$') ? service.price : `$${service.price}/hr`,
      };
      servicesStore = [newService, ...servicesStore];
      setStoredData('neighborhub_services', servicesStore);
      return newService;
    }
  },

  updateService: async (id: string, serviceData: any) => {
    try {
      const response = await apiFetch(`/services/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(serviceData)
      });
      return response.json();
    } catch (error) {
      console.error('Error updating service:', error);
      const service = servicesStore.find(s => s.id === id);
      if (service) {
        Object.assign(service, serviceData);
        setStoredData('neighborhub_services', servicesStore);
        return service;
      }
      return null;
    }
  },

  deleteService: async (id: string) => {
    try {
      await apiFetch(`/services/${encodeURIComponent(id)}`, { method: 'DELETE' });
      return true;
    } catch (error) {
      console.error('Error deleting service:', error);
      servicesStore = servicesStore.filter(s => s.id !== id);
      setStoredData('neighborhub_services', servicesStore);
      return true;
    }
  },

  updateServiceStatus: async (id: string, status: 'active' | 'inactive') => {
    try {
      return await servicesService.updateService(id, { status });
    } catch (error) {
      const service = servicesStore.find(s => s.id === id);
      if (service) {
        service.status = status;
        setStoredData('neighborhub_services', servicesStore);
        return service;
      }
      serviceOverridesStore[id] = { ...serviceOverridesStore[id], status };
      setStoredData('neighborhub_service_overrides', serviceOverridesStore);
      return { id, status } as any;
    }
  },
};

// Reviews Service
export const reviewsService = {
  getReviews: async (neighborhoodId?: string | number, type?: string) => {
    try {
      let url = '/reviews';
      const params = new URLSearchParams();
      if (neighborhoodId) params.append('neighborhoodId', String(neighborhoodId));
      if (type) params.append('type', type);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const reviews = await apiGet<Review[]>(url);
      return reviews;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return reviewsStore;
    }
  },

  addReview: async (review: Omit<Review, 'id' | 'reviewerId' | 'reviewer' | 'reviewerAvatar' | 'timestamp'>) => {
    try {
      const user = authService.getCurrentUser();
      const response = await apiFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          ...review,
          reviewerId: user.id,
          neighborhoodId: review.neighborhoodId || user.neighborhoodId
        })
      });
      return response.json();
    } catch (error) {
      console.error('Error adding review:', error);
      // Fallback
      const newReview: Review = {
        ...review,
        id: `review-${Date.now()}`,
        reviewerId: authUser.id,
        reviewer: authUser.name,
        reviewerAvatar: authUser.avatar,
        timestamp: new Date().toISOString(),
      };
      reviewsStore = [newReview, ...reviewsStore];
      setStoredData('neighborhub_reviews', reviewsStore);
      return newReview;
    }
  },

  updateReview: async (id: string, updates: { rating: number; comment: string }) => {
    try {
      const user = authService.getCurrentUser();
      const response = await apiFetch(`/reviews/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...updates,
          reviewerId: user.id
        })
      });
      return response.json();
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  },

  deleteReview: async (id: string) => {
    try {
      const user = authService.getCurrentUser();
      await apiFetch(`/reviews/${id}?reviewerId=${user.id}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  },
};

// Users Service
export const usersService = {
  getUsers: async () => {
    const users = await apiGet<User[]>('/users');
    return users;
  },

  getUser: async (id: string) => {
    const user = await apiGet<User>(`/users/${encodeURIComponent(id)}`);
    return user;
  },
};

// Neighborhoods Service
export const neighborhoodsService = {
  getNeighborhoods: async () => {
    try {
      const neighborhoods = await apiGet<Neighborhood[]>('/neighborhoods');
      return neighborhoods;
    } catch (error) {
      console.error('Error fetching neighborhoods from Supabase:', error);
      // Fallback to local store if API fails
      return neighborhoodsStore;
    }
  },

  getNeighborhood: async (id: string) => {
    try {
      const neighborhood = await apiGet<Neighborhood>(`/neighborhoods/${encodeURIComponent(id)}`);
      return neighborhood;
    } catch (error) {
      console.error('Error fetching neighborhood from Supabase:', error);
      return neighborhoodsStore.find(n => n.id === id);
    }
  },

  getEnrolledNeighborhoods: async (userId: string) => {
    try {
      const neighborhoods = await apiGet<Neighborhood[]>(`/users/${encodeURIComponent(userId)}/enrolled-neighborhoods`);
      return neighborhoods;
    } catch (error) {
      console.error('Error fetching enrolled neighborhoods:', error);
      return [];
    }
  },

  getCurrentNeighborhood: async () => {
    try {
      const user = authService.getCurrentUser();
      const neighborhood = await apiGet<Neighborhood>(`/neighborhoods/current?userId=${user.id}`);
      return neighborhood;
    } catch (error) {
      console.error('Error fetching current neighborhood from Supabase:', error);
      const user = authService.getCurrentUser();
      return neighborhoodsStore.find(n => n.leadId === user.id);
    }
  },

  updateSettings: async (neighborhoodId: string | number, settings: Partial<NeighborhoodSettings>) => {
    try {
      // Map camelCase to snake_case for API - save all settings to neighborhood_settings table
      const apiPayload = {
        enable_marketplace: settings.enableMarketplace,
        enable_resource_exchange: settings.enableResourceExchange,
        enable_public_alerts: settings.enablePublicAlerts,
        enable_events: settings.enableEvents,
        enable_services: settings.enableServices,
        require_verification: settings.requireVerification,
      };

      const response = await apiFetch(`/neighborhoods/${neighborhoodId}/hub-settings`, {
        method: 'PUT',
        body: JSON.stringify(apiPayload),
      });
      return response.json();
    } catch (error) {
      console.error('Error updating settings in Supabase:', error);
      // Fallback to local store
      const neighborhood = neighborhoodsStore.find(n => String(n.id) === String(neighborhoodId));
      if (neighborhood) {
        neighborhood.settings = { ...neighborhood.settings, ...settings };
        setStoredData('neighborhub_neighborhoods', neighborhoodsStore);
      }
      return neighborhood;
    }
  },

  updateGuidelines: async (neighborhoodId: string | number, guidelines: string) => {
    try {
      const response = await apiFetch(`/neighborhoods/${neighborhoodId}/guidelines`, {
        method: 'PUT',
        body: JSON.stringify({ guidelines }),
      });
      return response.json();
    } catch (error) {
      console.error('Error updating guidelines in Supabase:', error);
      // Fallback to local store
      const neighborhood = neighborhoodsStore.find(n => String(n.id) === String(neighborhoodId));
      if (neighborhood) {
        neighborhood.guidelines = guidelines;
        setStoredData('neighborhub_neighborhoods', neighborhoodsStore);
      }
      return neighborhood;
    }
  },

  updateBranding: async (neighborhoodId: string, coverPhoto?: string, logo?: string) => {
    try {
      const response = await apiFetch(`/neighborhoods/${neighborhoodId}/branding`, {
        method: 'PUT',
        body: JSON.stringify({ coverPhoto, logo }),
      });
      return response.json();
    } catch (error) {
      console.error('Error updating branding in Supabase:', error);
      // Fallback to local store
      const neighborhood = neighborhoodsStore.find(n => String(n.id) === String(neighborhoodId));
      if (neighborhood) {
        if (coverPhoto) neighborhood.coverPhoto = coverPhoto;
        if (logo) neighborhood.logo = logo;
        setStoredData('neighborhub_neighborhoods', neighborhoodsStore);
      }
      return neighborhood;
    }
  },

  deleteNeighborhood: async (neighborhoodId: string) => {
    try {
      await apiFetch(`/neighborhoods/${neighborhoodId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting neighborhood from Supabase:', error);
      // Fallback to local store
      neighborhoodsStore = neighborhoodsStore.filter(n => String(n.id) !== String(neighborhoodId));
      setStoredData('neighborhub_neighborhoods', neighborhoodsStore);
    }
  },

  joinNeighborhood: async (neighborhoodId: number) => {
    // Note: Most joining is now handled via JoinNeighborhoodModal.tsx which calls the API directly
    // This method remains for legacy support or simpler use cases
    try {
      const userId = localStorage.getItem('user_id') || authService.getCurrentUser().id;
      const response = await apiFetch(`/neighborhoods/${neighborhoodId}/join`, {
        method: 'POST',
        body: JSON.stringify({ userId }), // Note: Without lat/long this might fail if backend requires it
      });
      return response.json();
    } catch (error) {
      console.error('Error joining neighborhood:', error);
      throw error;
    }
  },

  leaveNeighborhood: async (neighborhoodId: number) => {
    try {
      const userId = localStorage.getItem('user_id') || authService.getCurrentUser().id;
      const response = await apiFetch(`/neighborhoods/${neighborhoodId}/leave`, {
        method: 'DELETE',
        body: JSON.stringify({ userId }),
      });
      const result = await response.json();
      // Clear user's neighborhood ID in local state
      authUser = { ...authUser, neighborhoodId: undefined };
      return result;
    } catch (error) {
      console.error('Error leaving neighborhood:', error);
      throw error;
    }
  },

  getUserNeighborhood: async (userId?: string) => {
    try {
      const id = userId || authService.getCurrentUser().id;
      const result = await apiGet<{ neighborhood: Neighborhood | null }>(`/users/${id}/neighborhood`);
      if (result.neighborhood) {
        // Update auth user with neighborhood ID
        authUser = { ...authUser, neighborhoodId: parseInt(result.neighborhood.id) };
      }
      return result.neighborhood;
    } catch (error) {
      console.error('Error fetching user neighborhood:', error);
      return null;
    }
  },
};

// Proposals Service
export const proposalsService = {
  getProposals: async () => {
    try {
      const user = authService.getCurrentUser();
      // If admin, get all proposals. If regular user, get only their own.
      const url = user.isAdmin ? '/proposals' : `/proposals/user/${user.id}`;
      const proposals = await apiGet<NeighborhoodProposal[]>(url);
      return proposals;
    } catch (error) {
      console.error('Error fetching proposals from Supabase:', error);
      // Fallback to local store
      const user = authService.getCurrentUser();
      if (user.isAdmin) {
        return proposalsStore;
      }
      return proposalsStore.filter(p => p.proposerId === user.id);
    }
  },

  getProposal: async (id: string) => {
    try {
      const proposal = await apiGet<NeighborhoodProposal>(`/proposals/${encodeURIComponent(id)}`);
      // Verify that the proposal belongs to the current user
      const user = authService.getCurrentUser();
      if (proposal.proposerId !== user.id) {
        throw new Error('Unauthorized: You can only view your own proposals');
      }
      return proposal;
    } catch (error) {
      console.error('Error fetching proposal from Supabase:', error);
      const user = authService.getCurrentUser();
      const proposal = proposalsStore.find(p => p.id === id);
      // Only return if it belongs to the current user
      if (proposal && proposal.proposerId === user.id) {
        return proposal;
      }
      return null;
    }
  },

  createProposal: async (proposal: Omit<NeighborhoodProposal, 'id' | 'status' | 'submittedDate'>) => {
    try {
      const response = await apiFetch('/proposals', {
        method: 'POST',
        body: JSON.stringify(proposal),
      });
      return response.json();
    } catch (error) {
      console.error('Error creating proposal in Supabase:', error);
      // Fallback to local store
      const newProposal: NeighborhoodProposal = {
        ...proposal,
        id: `proposal-${Date.now()}`,
        status: 'pending',
        submittedDate: new Date().toISOString().split('T')[0],
      };
      proposalsStore = [newProposal, ...proposalsStore];
      setStoredData('neighborhub_proposals', proposalsStore);
      return newProposal;
    }
  },

  updateProposalStatus: async (proposalId: string, status: NeighborhoodProposal['status'], reviewNotes?: string) => {
    try {
      const user = authService.getCurrentUser();
      const response = await apiFetch(`/proposals/${proposalId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, reviewNotes, adminId: user.id }),
      });
      return response.json();
    } catch (error) {
      console.error('Error updating proposal status in Supabase:', error);
      // Fallback to local store
      const proposal = proposalsStore.find(p => p.id === proposalId);
      if (proposal) {
        proposal.status = status;
        proposal.reviewedDate = new Date().toISOString().split('T')[0];
        if (reviewNotes) proposal.reviewNotes = reviewNotes;
        setStoredData('neighborhub_proposals', proposalsStore);
      }
      return proposal;
    }
  },
};

// Messages Service
export const messagesService = {
  getConversations: async () => {
    try {
      const user = authService.getCurrentUser();
      return await apiGet<Conversation[]>(`/messages/conversations?userId=${user.id}`);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return conversationsStore;
    }
  },

  getMessages: async (conversationId: string) => {
    try {
      return await apiGet<Message[]>(`/messages/${conversationId}`);
    } catch (error) {
      console.error('Error fetching messages:', error);
      return messagesStore[conversationId] || [];
    }
  },

  sendMessage: async (data: { conversationId?: string; recipientId?: string; content: string; image?: string }) => {
    try {
      const user = authService.getCurrentUser();
      const response = await apiFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          senderId: user.id
        })
      });
      return response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  markAsRead: async (messageId: string) => {
    try {
      const response = await apiFetch(`/messages/${messageId}/read`, {
        method: 'PUT'
      });
      return response.json();
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },

  getNeighborhoodMembers: async (neighborhoodId: string | number) => {
    try {
      const user = authService.getCurrentUser();
      return await apiGet<User[]>(`/messages/neighborhood/${neighborhoodId}/members?currentUserId=${user.id}`);
    } catch (error) {
      console.error('Error fetching neighborhood members:', error);
      return [];
    }
  }
};

// Location Service
export const locationService = {
  getCurrentLocation: async () => {
    const location = await apiGet<{ lat: number; lng: number }>('/location');
    return location;
  },
};

// Provider Applications Service
export const providerApplicationsService = {
  getApplications: async () => {
    try {
      const data = await apiGet<ProviderApplication[]>('/provider-applications');
      return data;
    } catch (error) {
      console.error('Error fetching provider applications from Supabase:', error);
      return providerApplicationsStore;
    }
  },

  submitApplication: async (application: Omit<ProviderApplication, 'id' | 'status' | 'submittedDate' | 'userId'>) => {
    try {
      const response = await apiFetch('/provider-applications', {
        method: 'POST',
        body: JSON.stringify({
          userId: authUser.id,
          fullName: application.fullName,
          category: application.category,
          experience: application.experience,
          description: application.description,
        }),
      });
      return response.json();
    } catch (error) {
      console.error('Error submitting provider application to Supabase:', error);
      // Fallback to local store
      const newApplication: ProviderApplication = {
        ...application,
        id: `app-${Date.now()}`,
        userId: authUser.id,
        status: 'pending',
        submittedDate: new Date().toISOString().split('T')[0],
      };
      providerApplicationsStore = [newApplication, ...providerApplicationsStore];
      setStoredData('neighborhub_provider_applications', providerApplicationsStore);
      return newApplication;
    }
  },

  updateApplicationStatus: (id: string, status: ProviderApplication['status']) => {
    const application = providerApplicationsStore.find(a => a.id === id);
    if (application) {
      application.status = status;
      setStoredData('neighborhub_provider_applications', providerApplicationsStore);
    }
    return Promise.resolve(application);
  }
};

// Helper function
function getCategoryColor(category: string): string {
  const colors: { [key: string]: string } = {
    'Lost & Found': 'bg-orange-100 text-orange-700',
    'Event': 'bg-blue-100 text-blue-700',
    'Question': 'bg-purple-100 text-purple-700',
    'Announcement': 'bg-green-100 text-green-700',
    'Safety': 'bg-red-100 text-red-700',
    'General': 'bg-gray-100 text-gray-700',
  };
  return colors[category] || 'bg-gray-100 text-gray-700';
}