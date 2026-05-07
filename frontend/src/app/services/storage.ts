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
  neighborhoodId: 11, // Reset to 1 for standard test data
};

let authUser: User = localCurrentUser;
let isAuthenticated = false;

// Auth Service
export const authService = {
  login: (email: string, password: string) => {
    // Simulate login
    return new Promise<User>((resolve) => {
      setTimeout(() => {
        isAuthenticated = true;
        authUser = localCurrentUser;
        resolve(authUser);
      }, 500);
    });
  },

  signup: (name: string, email: string, password: string, phone: string, address: string) => {
    return new Promise<User>((resolve) => {
      setTimeout(() => {
        isAuthenticated = true;
        authUser = localCurrentUser;
        resolve(authUser);
      }, 500);
    });
  },

  logout: () => {
    isAuthenticated = false;
  },

  getCurrentUser: () => authUser,

  isAuthenticated: () => isAuthenticated,

  updateProfile: (updates: Partial<User>) => {
    authUser = { ...authUser, ...updates };
    return Promise.resolve(authUser);
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
    const services = await apiGet<Service[]>('/services');
    return services;
  },

  getService: async (id: string) => {
    const service = await apiGet<Service>(`/services/${encodeURIComponent(id)}`);
    return service;
  },

  requestService: async (serviceId: string, description: string, scheduledDate?: string) => {
    const service = await apiGet<Service>(`/services/${encodeURIComponent(serviceId)}`);
    if (!service) return Promise.reject('Service not found');

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
    return Promise.resolve(newRequest);
  },

  getMyRequests: () => Promise.resolve(serviceRequestsStore.filter(r => r.userId === authUser.id)),

  updateRequestStatus: (requestId: string, status: ServiceRequest['status']) => {
    const request = serviceRequestsStore.find(r => r.id === requestId);
    if (request) {
      request.status = status;
      setStoredData('neighborhub_service_requests', serviceRequestsStore);
    }
    return Promise.resolve(request);
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

  joinNeighborhood: async (neighborhoodId: string | number) => {
    try {
      const user = authService.getCurrentUser();
      const response = await apiFetch(`/neighborhoods/${neighborhoodId}/join`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      });
      const result = await response.json();
      // Update user's neighborhood ID
      authUser = { ...authUser, neighborhoodId: parseInt(String(neighborhoodId)) };
      return result;
    } catch (error) {
      console.error('Error joining neighborhood:', error);
      throw error;
    }
  },

  leaveNeighborhood: async (neighborhoodId: string | number) => {
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

  checkInsideNeighborhood: (lat: number, lng: number) => {
    // Simplified point-in-polygon check
    const neighborhood = neighborhoodsStore.find((n) => n.verified);
    return Promise.resolve(neighborhood);
  },
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