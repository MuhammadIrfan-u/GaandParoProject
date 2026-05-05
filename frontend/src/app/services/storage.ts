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

const apiFetch = async (path: string, init?: RequestInit) => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
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
  id: 'user-1',
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
  neighborhoodId: 3,
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

  login: async (email: string, password: string) => {
    // Simulate login and sync
    isAuthenticated = true;
    authUser = localCurrentUser;
    await authService.syncUser(authUser);
    return authUser;
  },

  signup: async (name: string, email: string, password: string, phone: string, address: string) => {
    isAuthenticated = true;
    authUser = {
      ...localCurrentUser,
      name,
      email,
      phone,
      address,
      id: `user-${Date.now()}`
    };
    await authService.syncUser(authUser);
    return authUser;
  },

  logout: () => {
    isAuthenticated = false;
  },

  getCurrentUser: () => authUser,

  isAuthenticated: () => isAuthenticated,

  updateProfile: async (updates: Partial<User>) => {
    authUser = { ...authUser, ...updates };
    await authService.syncUser(authUser);
    return authUser;
  },
};

// Posts Service
export const postsService = {
  getPosts: async () => {
    const posts = await apiGet<Post[]>('/posts');
    return posts;
  },

  getPost: async (id: string) => {
    const post = await apiGet<Post>(`/posts/${encodeURIComponent(id)}`);
    return post;
  },

  createPost: async (content: string, image?: string, category?: string) => {
    const response = await apiFetch('/posts', {
      method: 'POST',
      body: JSON.stringify({
        authorId: authUser.id,
        content,
        image,
        category,
      }),
    });
    return response.json();
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

  addComment: (postId: string, content: string) => {
    const post = postsStore.find(p => p.id === postId);
    if (post) {
      const comment = {
        id: `comment-${Date.now()}`,
        authorId: authUser.id,
        author: authUser.name,
        avatar: authUser.avatar,
        content,
        time: 'Just now',
      };
      post.comments.push(comment);
      setStoredData('neighborhub_posts', postsStore);
    }
    return Promise.resolve(post);
  },

  deletePost: (postId: string) => {
    postsStore = postsStore.filter(p => p.id !== postId);
    setStoredData('neighborhub_posts', postsStore);
    return Promise.resolve(true);
  },
};

// Marketplace Service
export const marketplaceService = {
  getItems: async () => {
    const items = await apiGet<MarketplaceItem[]>('/marketplace');
    return items;
  },

  getItem: async (id: string) => {
    const item = await apiGet<MarketplaceItem>(`/marketplace/${encodeURIComponent(id)}`);
    return item;
  },

  createItem: async (item: Omit<MarketplaceItem, 'id' | 'sellerId' | 'seller' | 'sellerAvatar' | 'verified' | 'postedDate' | 'status'>) => {
    const response = await apiFetch('/marketplace', {
      method: 'POST',
      body: JSON.stringify({
        ...item,
        sellerId: authUser.id,
      }),
    });
    return response.json();
  },

  updateItemStatus: (itemId: string, status: MarketplaceItem['status']) => {
    const item = marketplaceStore.find(i => i.id === itemId);
    if (item) {
      item.status = status;
      setStoredData('neighborhub_marketplace', marketplaceStore);
    }
    return Promise.resolve(item);
  },

  deleteItem: (itemId: string) => {
    marketplaceStore = marketplaceStore.filter(i => i.id !== itemId);
    setStoredData('neighborhub_marketplace', marketplaceStore);
    return Promise.resolve(true);
  },
};

// Events Service
export const eventsService = {
  getEvents: async () => {
    const events = await apiGet<Event[]>('/events');
    return events;
  },

  getEvent: async (id: string) => {
    const event = await apiGet<Event>(`/events/${encodeURIComponent(id)}`);
    return event;
  },

  createEvent: async (event: Omit<Event, 'id' | 'organizerId' | 'organizer' | 'organizerAvatar' | 'attendees'>) => {
    const response = await apiFetch('/events', {
      method: 'POST',
      body: JSON.stringify({
        ...event,
        organizerId: authUser.id,
      }),
    });
    return response.json();
  },

  rsvpEvent: (eventId: string) => {
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
    return Promise.resolve(event);
  },

  deleteEvent: (eventId: string) => {
    eventsStore = eventsStore.filter(e => e.id !== eventId);
    setStoredData('neighborhub_events', eventsStore);
    return Promise.resolve(true);
  },
};

// Alerts Service
export const alertsService = {
  getAlerts: async () => {
    const alerts = await apiGet<Alert[]>('/alerts');
    return alerts;
  },

  createAlert: async (alert: Omit<Alert, 'id' | 'authorId' | 'author' | 'timestamp' | 'resolved'>) => {
    const response = await apiFetch('/alerts', {
      method: 'POST',
      body: JSON.stringify({
        ...alert,
        authorId: authUser.id,
      }),
    });
    return response.json();
  },

  resolveAlert: (alertId: string) => {
    const alert = alertsStore.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      setStoredData('neighborhub_alerts', alertsStore);
    }
    return Promise.resolve(alert);
  },
};

// Messages Service
export const messagesService = {
  getConversations: async () => {
    const conversations = await apiGet<Conversation[]>('/conversations');
    return conversations;
  },

  getMessages: async (conversationId: string) => {
    const messages = await apiGet<Message[]>(`/messages/${encodeURIComponent(conversationId)}`);
    return messages;
  },

  sendMessage: async (conversationId: string, content: string, image?: string) => {
    const response = await apiFetch('/messages', {
      method: 'POST',
      body: JSON.stringify({ conversationId, content, image })
    });
    return response.json();
  },

  markAsRead: (conversationId: string) => {
    // Keeping local for now or can implement a patch endpoint
    const conversation = conversationsStore.find(c => c.id === conversationId);
    if (conversation) {
      conversation.unreadCount = 0;
      setStoredData('neighborhub_conversations', conversationsStore);
    }
    return Promise.resolve(true);
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
    const notifications = await apiGet<Notification[]>('/notifications');
    return notifications;
  },

  markAsRead: (notificationId: string) => {
    const notification = notificationsStore.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      setStoredData('neighborhub_notifications', notificationsStore);
    }
    return Promise.resolve(notification);
  },

  markAllAsRead: () => {
    notificationsStore = notificationsStore.map(n => ({ ...n, read: true }));
    setStoredData('neighborhub_notifications', notificationsStore);
    return Promise.resolve(true);
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
    const backendServices = await apiGet<Service[]>('/services');
    // Merge backend services with overrides
    const mergedBackend = backendServices.map(s => ({
      ...s,
      ...(serviceOverridesStore[s.id] || {})
    }));
    return [...servicesStore, ...mergedBackend];
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

  getProviderRequests: async (providerName: string) => {
    try {
      const services = await servicesService.getServices();
      const myServices = services.filter(s => s.provider === providerName);
      const myServiceIds = myServices.map(s => s.id);

      const allRequests = await apiGet<ServiceRequest[]>('/service-requests');
      // For local fallback compatibility, handle string vs int IDs properly 
      return allRequests.filter(r => myServiceIds.includes(String(r.serviceId)) || myServiceIds.includes(r.serviceId));
    } catch (error) {
      return serviceRequestsStore.filter(r => r.provider === providerName);
    }
  },

  updateRequestStatus: (requestId: string, status: ServiceRequest['status']) => {
    const request = serviceRequestsStore.find(r => r.id === requestId);
    if (request) {
      request.status = status;
      setStoredData('neighborhub_service_requests', serviceRequestsStore);
    }
    return Promise.resolve(request);
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
  getReviews: (targetId: string) => Promise.resolve(reviewsStore.filter(r => r.targetId === targetId)),

  addReview: (review: Omit<Review, 'id' | 'reviewerId' | 'reviewer' | 'reviewerAvatar' | 'timestamp'>) => {
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
    return Promise.resolve(newReview);
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
      const neighborhood = neighborhoodsStore.find(n => n.id === parseInt(neighborhoodId as string));
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
      const neighborhood = neighborhoodsStore.find(n => n.id === neighborhoodId);
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
      const neighborhood = neighborhoodsStore.find(n => n.id === neighborhoodId);
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
      neighborhoodsStore = neighborhoodsStore.filter(n => n.id !== neighborhoodId);
      setStoredData('neighborhub_neighborhoods', neighborhoodsStore);
    }
  },

  joinNeighborhood: async (neighborhoodId: number) => {
    try {
      const user = authService.getCurrentUser();
      const response = await apiFetch(`/neighborhoods/${neighborhoodId}/join`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      });
      const result = await response.json();
      // Update user's neighborhood ID
      authUser = { ...authUser, neighborhoodId };
      return result;
    } catch (error) {
      console.error('Error joining neighborhood:', error);
      throw error;
    }
  },

  leaveNeighborhood: async (neighborhoodId: number) => {
    try {
      const user = authService.getCurrentUser();
      const response = await apiFetch(`/neighborhoods/${neighborhoodId}/leave`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      });
      const result = await response.json();
      // Clear user's neighborhood ID
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
      // Get only the current user's proposals
      const user = authService.getCurrentUser();
      const proposals = await apiGet<NeighborhoodProposal[]>(`/proposals/user/${user.id}`);
      return proposals;
    } catch (error) {
      console.error('Error fetching proposals from Supabase:', error);
      // Fallback to local store - only return user's proposals
      const user = authService.getCurrentUser();
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