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
    const neighborhoods = await apiGet<Neighborhood[]>('/neighborhoods');
    return neighborhoods;
  },
  
  getNeighborhood: async (id: string) => {
    const neighborhood = await apiGet<Neighborhood>(`/neighborhoods/${encodeURIComponent(id)}`);
    return neighborhood;
  },
  
  getCurrentNeighborhood: async () => {
    const neighborhood = await apiGet<Neighborhood>('/neighborhoods/current');
    return neighborhood;
  },
  
  updateSettings: (neighborhoodId: string, settings: Partial<NeighborhoodSettings>) => {
    const neighborhood = neighborhoodsStore.find(n => n.id === neighborhoodId);
    if (neighborhood) {
      neighborhood.settings = { ...neighborhood.settings, ...settings };
      setStoredData('neighborhub_neighborhoods', neighborhoodsStore);
    }
    return Promise.resolve(neighborhood);
  },
  
  updateGuidelines: (neighborhoodId: string, guidelines: string) => {
    const neighborhood = neighborhoodsStore.find(n => n.id === neighborhoodId);
    if (neighborhood) {
      neighborhood.guidelines = guidelines;
      setStoredData('neighborhub_neighborhoods', neighborhoodsStore);
    }
    return Promise.resolve(neighborhood);
  },
  
  updateBranding: (neighborhoodId: string, coverPhoto?: string, logo?: string) => {
    const neighborhood = neighborhoodsStore.find(n => n.id === neighborhoodId);
    if (neighborhood) {
      if (coverPhoto) neighborhood.coverPhoto = coverPhoto;
      if (logo) neighborhood.logo = logo;
      setStoredData('neighborhub_neighborhoods', neighborhoodsStore);
    }
    return Promise.resolve(neighborhood);
  },
};

// Proposals Service
export const proposalsService = {
  getProposals: async () => {
    const proposals = await apiGet<NeighborhoodProposal[]>('/proposals');
    return proposals;
  },
  
  getProposal: async (id: string) => {
    const proposal = await apiGet<NeighborhoodProposal>(`/proposals/${encodeURIComponent(id)}`);
    return proposal;
  },
  
  createProposal: (proposal: Omit<NeighborhoodProposal, 'id' | 'status' | 'submittedDate'>) => {
    const newProposal: NeighborhoodProposal = {
      ...proposal,
      id: `proposal-${Date.now()}`,
      status: 'pending',
      submittedDate: new Date().toISOString().split('T')[0],
    };
    proposalsStore = [newProposal, ...proposalsStore];
    setStoredData('neighborhub_proposals', proposalsStore);
    return Promise.resolve(newProposal);
  },
  
  updateProposalStatus: (proposalId: string, status: NeighborhoodProposal['status'], reviewNotes?: string) => {
    const proposal = proposalsStore.find(p => p.id === proposalId);
    if (proposal) {
      proposal.status = status;
      proposal.reviewedDate = new Date().toISOString().split('T')[0];
      if (reviewNotes) proposal.reviewNotes = reviewNotes;
      setStoredData('neighborhub_proposals', proposalsStore);
    }
    return Promise.resolve(proposal);
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