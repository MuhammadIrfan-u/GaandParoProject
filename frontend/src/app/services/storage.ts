// Storage & API Service Layer
// Auth calls hit the real backend; other services use mock data + localStorage

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
  AuthResponse,
  Report
} from './types';

const API_BASE = 'http://localhost:3000';

// ── JWT helpers ───────────────────────────────────────────────────────────────
const TOKEN_KEY = 'neighborhub_token';
const USER_KEY  = 'neighborhub_user';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

// ── Base fetch — attaches JWT when available ──────────────────────────────────
const apiFetch = async (path: string, init?: RequestInit) => {
  const token = tokenStorage.get();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed: ${response.status}`);
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
let reportsStore: Report[] = getStoredData('neighborhub_reports', []);

// ── Auth state (hydrated from localStorage on page load) ─────────────────────
const storedUser = localStorage.getItem(USER_KEY);
let authUser: User = storedUser ? JSON.parse(storedUser) : null;
let isAuthenticated: boolean = !!tokenStorage.get() && !!authUser;

// ── Auth Service — wired to real backend ─────────────────────────────────────
export const authService = {
  // REQ-3, REQ-4: login and receive JWT
  login: async (email: string, password: string): Promise<User> => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data: AuthResponse = await res.json();
    tokenStorage.set(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    authUser = data.user;
    isAuthenticated = true;
    return data.user;
  },

  // REQ-1, REQ-2: register (isServiceProvider maps business owner role)
  signup: async (
    name: string,
    email: string,
    password: string,
    phone: string,
    address: string,
    role: string = 'resident'
  ): Promise<User> => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone, address, role }),
    });
    const data: AuthResponse = await res.json();
    tokenStorage.set(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    authUser = data.user;
    isAuthenticated = true;
    return data.user;
  },

  // REQ-7, REQ-8: forgot password — sends reset email
  forgotPassword: async (email: string): Promise<string> => {
    const res = await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return data.message;
  },

  // REQ-7, REQ-8: reset password with token from email link
  resetPassword: async (token: string, password: string): Promise<User> => {
    const res = await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
    const data: AuthResponse = await res.json();
    tokenStorage.set(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    authUser = data.user;
    isAuthenticated = true;
    return data.user;
  },

  // REQ-13: validate session — verify token is still valid
  validateSession: async (): Promise<User | null> => {
    try {
      const res = await apiFetch('/auth/me');
      const data = await res.json();
      authUser = data.user;
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      isAuthenticated = true;
      return data.user;
    } catch {
      authService.logout();
      return null;
    }
  },

  logout: (): void => {
    tokenStorage.clear();
    localStorage.removeItem(USER_KEY);
    authUser = null as unknown as User;
    isAuthenticated = false;
  },

  getCurrentUser: (): User => authUser,

  isAuthenticated: (): boolean => isAuthenticated,

  // REQ-6.2, REQ-9: update profile and privacy settings
  updateProfile: async (updates: Partial<User>): Promise<User> => {
    const res = await apiFetch('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    authUser = data.user;
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  },

  // Change password for authenticated user
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiFetch('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
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
  
  createPost: (content: string, category: string) => {
    const newPost: Post = {
      id: `post-${Date.now()}`,
      authorId: authUser.id,
      author: authUser.name,
      avatar: authUser.avatar,
      verified: authUser.verified,
      time: 'Just now',
      content,
      likes: 0,
      comments: [],
      category,
      categoryColor: getCategoryColor(category),
      likedBy: [],
    };
    postsStore = [newPost, ...postsStore];
    setStoredData('neighborhub_posts', postsStore);
    return Promise.resolve(newPost);
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
  
  createItem: (item: Omit<MarketplaceItem, 'id' | 'sellerId' | 'seller' | 'sellerAvatar' | 'verified' | 'postedDate' | 'status'>) => {
    const newItem: MarketplaceItem = {
      ...item,
      id: `market-${Date.now()}`,
      sellerId: authUser.id,
      seller: authUser.name,
      sellerAvatar: authUser.avatar,
      verified: authUser.verified,
      postedDate: 'Just now',
      status: 'available',
    };
    marketplaceStore = [newItem, ...marketplaceStore];
    setStoredData('neighborhub_marketplace', marketplaceStore);
    return Promise.resolve(newItem);
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
  
  createEvent: (event: Omit<Event, 'id' | 'organizerId' | 'organizer' | 'organizerAvatar' | 'attendees'>) => {
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
    return Promise.resolve(newEvent);
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
  
  createAlert: (alert: Omit<Alert, 'id' | 'authorId' | 'author' | 'timestamp' | 'resolved'>) => {
    const newAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}`,
      authorId: authUser.id,
      author: authUser.name,
      timestamp: new Date().toISOString(),
      resolved: false,
    };
    alertsStore = [newAlert, ...alertsStore];
    setStoredData('neighborhub_alerts', alertsStore);
    return Promise.resolve(newAlert);
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
    const messages = await apiGet<Message[]>(`/conversations/${encodeURIComponent(conversationId)}/messages`);
    return messages;
  },
  
  sendMessage: (conversationId: string, content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: authUser.id,
      sender: authUser.name,
      senderAvatar: authUser.avatar,
      content,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    if (!messagesStore[conversationId]) {
      messagesStore[conversationId] = [];
    }
    messagesStore[conversationId].push(newMessage);
    
    // Update conversation
    const conversation = conversationsStore.find(c => c.id === conversationId);
    if (conversation) {
      conversation.lastMessage = content;
      conversation.lastMessageTime = 'Just now';
    }
    
    setStoredData('neighborhub_messages', messagesStore);
    setStoredData('neighborhub_conversations', conversationsStore);
    
    return Promise.resolve(newMessage);
  },
  
  markAsRead: (conversationId: string) => {
    const conversation = conversationsStore.find(c => c.id === conversationId);
    if (conversation) {
      conversation.unreadCount = 0;
      setStoredData('neighborhub_conversations', conversationsStore);
    }
    return Promise.resolve(true);
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
  
  checkInsideNeighborhood: (lat: number, lng: number) => {
    // Simplified point-in-polygon check
    const neighborhood = neighborhoodsStore.find((n) => n.verified);
    return Promise.resolve(neighborhood);
  },
};

export const reportsService = {
  submitReport: async (
    report: Omit<Report, 'id' | 'status' | 'timestamp' | 'reporterId'>
  ) => {
    const res = await apiFetch('/reports', {
      method: 'POST',
      body: JSON.stringify({
        ...report,
        reporterId: authUser.id,
      }),
    });

    return res.json();
  },

  getReports: async () => {
    const res = await apiFetch('/reports');
    return res.json();
  },

  getMyReports: async () => {
    const res = await apiFetch(`/reports/user/${authUser.id}`);
    return res.json();
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