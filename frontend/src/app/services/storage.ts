// Local Storage Service
// This simulates a backend with persistent local storage

import {
  posts as initialPosts,
  marketplaceItems as initialMarketplaceItems,
  events as initialEvents,
  alerts as initialAlerts,
  conversations as initialConversations,
  messages as initialMessages,
  notifications as initialNotifications,
  serviceRequests as initialServiceRequests,
  services as initialServices,
  currentUser,
  users,
  reviews,
  neighborhoods as initialNeighborhoods,
  neighborhoodProposals as initialProposals,
  currentLocation,
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
  Report,
} from './mockData';

import {
  DbPost,
  DbAlert,
  DbReport,
  ProviderApplication,
  DbEvent,
  DbMarketplaceItem,
  DbComment,
  DbReview,
  DbNeighborhoodMember,
  dbPosts,
  dbAlerts,
  dbReports,
  providerApplications,
  dbEvents,
  dbMarketplaceItems,
  dbComments,
  dbReviews,
  dbNeighborhoodMembers
} from './dbData';

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

// Data stores
let postsStore = getStoredData('neighborhub_posts', initialPosts);
let marketplaceStore = getStoredData('neighborhub_marketplace', initialMarketplaceItems);
let eventsStore = getStoredData('neighborhub_events', initialEvents);
let alertsStore = getStoredData('neighborhub_alerts', initialAlerts);
let conversationsStore = getStoredData('neighborhub_conversations', initialConversations);
let messagesStore = getStoredData('neighborhub_messages', initialMessages);
let notificationsStore = getStoredData('neighborhub_notifications', initialNotifications);
let serviceRequestsStore = getStoredData('neighborhub_service_requests', initialServiceRequests);
let reviewsStore = getStoredData('neighborhub_reviews', reviews);
let neighborhoodsStore = getStoredData('neighborhub_neighborhoods', initialNeighborhoods);
let proposalsStore = getStoredData('neighborhub_proposals', initialProposals);
let locationStore = getStoredData('neighborhub_location', currentLocation);
let reportsStore = getStoredData<Report[]>('neighborhub_reports', []);
let usersStore = getStoredData<User[]>('neighborhub_users', users);

// DB Data Stores (Simulating real DB tables)
let dbPostsStore = getStoredData<DbPost[]>('hub_db_posts', dbPosts);
let dbAlertsStore = getStoredData<DbAlert[]>('hub_db_alerts', dbAlerts);
let dbReportsStore = getStoredData<DbReport[]>('hub_db_reports', dbReports);
let providerAppsStore = getStoredData<ProviderApplication[]>('hub_db_provider_apps', providerApplications);
let dbEventsStore = getStoredData<DbEvent[]>('hub_db_events', dbEvents);
let dbMarketplaceStore = getStoredData<DbMarketplaceItem[]>('hub_db_marketplace', dbMarketplaceItems);
let dbCommentsStore = getStoredData<DbComment[]>('hub_db_comments', dbComments);
let dbReviewsStore = getStoredData<DbReview[]>('hub_db_reviews', dbReviews);
let dbNeighborhoodMembersStore = getStoredData<DbNeighborhoodMember[]>('hub_db_neighbors', dbNeighborhoodMembers);

// Auth State
let authUser = currentUser;
let isAuthenticated = false;

// Auth Service
export const authService = {
  login: (email: string, password: string) => {
    // Simulate login
    return new Promise<User>((resolve) => {
      setTimeout(() => {
        isAuthenticated = true;
        resolve(currentUser);
      }, 500);
    });
  },

  signup: (name: string, email: string, password: string, phone: string, address: string) => {
    return new Promise<User>((resolve) => {
      setTimeout(() => {
        isAuthenticated = true;
        resolve(currentUser);
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
  getPosts: () => Promise.resolve([...postsStore]),

  getPost: (id: string) => Promise.resolve(postsStore.find(p => p.id === id)),

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

  deleteComment: (postId: string, commentId: string) => {
    const post = postsStore.find(p => p.id === postId);
    if (post) {
      post.comments = post.comments.filter(c => c.id !== commentId);
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
  getItems: () => Promise.resolve([...marketplaceStore]),

  getItem: (id: string) => Promise.resolve(marketplaceStore.find(i => i.id === id)),

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
  getEvents: () => Promise.resolve([...eventsStore]),

  getEvent: (id: string) => Promise.resolve(eventsStore.find(e => e.id === id)),

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
  getAlerts: () => Promise.resolve([...alertsStore]),

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
  getConversations: () => Promise.resolve([...conversationsStore]),

  getMessages: (conversationId: string) => Promise.resolve(messagesStore[conversationId] || []),

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
  getNotifications: () => Promise.resolve([...notificationsStore]),

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

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    notificationsStore = [newNotification, ...notificationsStore];
    setStoredData('neighborhub_notifications', notificationsStore);
    return Promise.resolve(newNotification);
  },
};

// Services Service
export const servicesService = {
  getServices: () => Promise.resolve([...initialServices]),

  getService: (id: string) => Promise.resolve(initialServices.find(s => s.id === id)),

  requestService: (serviceId: string, description: string, scheduledDate?: string) => {
    const service = initialServices.find(s => s.id === serviceId);
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

  getAllRequests: () => Promise.resolve([...serviceRequestsStore]),
};

// Reviews Service
export const reviewsService = {
  getAllReviews: () => Promise.resolve([...reviewsStore]),

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

// Reports Service
export const reportsService = {
  getReports: () => Promise.resolve([...reportsStore]),

  createReport: (report: Omit<Report, 'id' | 'status' | 'timestamp'>) => {
    const newReport: Report = {
      ...report,
      id: `rep-${Date.now()}`,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };
    reportsStore = [newReport, ...reportsStore];
    setStoredData('neighborhub_reports', reportsStore);
    return Promise.resolve(newReport);
  },

  updateReportStatus: (reportId: string, status: Report['status']) => {
    const report = reportsStore.find(r => r.id === reportId);
    if (report) {
      report.status = status;
      setStoredData('neighborhub_reports', reportsStore);
    }
    return Promise.resolve(report);
  }
};

// Users Service
export const usersService = {
  getUsers: () => Promise.resolve([...users]),

  getUser: (id: string) => Promise.resolve(users.find(u => u.id === id)),
};

// Neighborhoods Service
export const neighborhoodsService = {
  getNeighborhoods: () => Promise.resolve([...neighborhoodsStore]),

  getNeighborhood: (id: string) => Promise.resolve(neighborhoodsStore.find(n => n.id === id)),

  getCurrentNeighborhood: () => {
    // Find neighborhood based on current location
    const neighborhood = neighborhoodsStore.find(n => {
      // Simple point-in-polygon check (simplified for demo)
      return n.verified;
    });
    return Promise.resolve(neighborhood);
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
  getProposals: () => Promise.resolve([...proposalsStore]),

  getProposal: (id: string) => Promise.resolve(proposalsStore.find(p => p.id === id)),

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
  getCurrentLocation: () => Promise.resolve(locationStore),

  checkInsideNeighborhood: (lat: number, lng: number) => {
    // Simplified point-in-polygon check
    const neighborhood = neighborhoodsStore.find(n => {
      if (!n.boundary) return false;
      const coords = n.boundary.coordinates;
      // Simple bounding box check for demo
      const lats = coords.map(c => c.lat);
      const lngs = coords.map(c => c.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    });

    return Promise.resolve(neighborhood);
  },
};

// Database Services (for Analytics and Admin features)
export const dbService = {
  // Posts
  getPosts: () => Promise.resolve([...dbPostsStore]),
  deletePost: (id: number) => {
    dbPostsStore = dbPostsStore.filter(p => p.id !== id);
    setStoredData('hub_db_posts', dbPostsStore);
    return Promise.resolve(true);
  },

  // Alerts
  getAlerts: () => Promise.resolve([...dbAlertsStore]),
  deleteAlert: (id: number) => {
    dbAlertsStore = dbAlertsStore.filter(a => a.id !== id);
    setStoredData('hub_db_alerts', dbAlertsStore);
    return Promise.resolve(true);
  },

  // Reports
  getReports: () => Promise.resolve([...dbReportsStore]),
  resolveReport: (reportId: number, action: 'allow' | 'delete') => {
    const report = dbReportsStore.find(r => r.id === reportId);
    if (!report) return Promise.reject('Report not found');

    if (action === 'delete') {
      // Logic to delete the item based on reported_item_type and reported_item_id
      if (report.reported_item_type === 'post') {
        dbPostsStore = dbPostsStore.filter(p => p.id === report.reported_item_id);
      } else if (report.reported_item_type === 'comment') {
        dbCommentsStore = dbCommentsStore.filter(c => c.id === report.reported_item_id);
      } else if (report.reported_item_type === 'alert') {
        dbAlertsStore = dbAlertsStore.filter(a => a.id === report.reported_item_id);
      }

      // Notify the author (mocked since we don't have full author mapping here yet)
      notificationsService.addNotification({
        userId: 'reported-user', // In a real app, you'd find the author
        title: 'Content Removed',
        message: `Your ${report.reported_item_type} was removed following a report.`,
        type: 'system'
      });
    } else {
      // Notify the reporter that their report was dismissed
      notificationsService.addNotification({
        userId: report.reporter_id.toString(),
        title: 'Report Update',
        message: `Your report for a ${report.reported_item_type} was reviewed and dismissed.`,
        type: 'system'
      });
    }

    report.status = 'resolved';
    setStoredData('hub_db_reports', dbReportsStore);
    setStoredData('hub_db_posts', dbPostsStore);
    setStoredData('hub_db_alerts', dbAlertsStore);
    setStoredData('hub_db_comments', dbCommentsStore);

    return Promise.resolve(report);
  },

  // Events
  getEvents: () => Promise.resolve([...dbEventsStore]),

  // Marketplace
  getMarketplaceItems: () => Promise.resolve([...dbMarketplaceStore]),

  // Provider Applications
  getProviderApplications: () => Promise.resolve([...providerAppsStore]),
  approveProviderApplication: (appId: number) => {
    const app = providerAppsStore.find(a => a.id === appId);
    if (app) {
      // Logic to upgrade user to provider would go here
      notificationsService.addNotification({
        userId: app.user_id.toString(),
        title: 'Application Approved',
        message: `Your application for ${app.category} has been approved. You are now a certified provider!`,
        type: 'success'
      });
      providerAppsStore = providerAppsStore.filter(a => a.id !== appId);
      setStoredData('hub_db_provider_apps', providerAppsStore);
    }
    return Promise.resolve(true);
  },

  // Comments
  getComments: () => Promise.resolve([...dbCommentsStore]),
  deleteComment: (id: number) => {
    dbCommentsStore = dbCommentsStore.filter(c => c.id !== id);
    setStoredData('hub_db_comments', dbCommentsStore);
    return Promise.resolve(true);
  },

  // Reviews Moderation
  getReviews: () => Promise.resolve([...dbReviewsStore]),
  
  allowReview: (id: number) => {
    const review = dbReviewsStore.find(r => r.id === id);
    if (review) {
      review.moderation_status = 'approved';
      review.is_flagged = false;
      setStoredData('hub_db_reviews', dbReviewsStore);
    }
    return Promise.resolve(true);
  },

  notifyReviewer: (reviewerId: number, message: string) => {
    notificationsService.addNotification({
      userId: reviewerId.toString(),
      title: 'Review Warning',
      message: message,
      type: 'warning'
    });
    return Promise.resolve(true);
  },

  deleteReviewAndBan: (reviewId: number, reviewerId: number) => {
    // 1. Delete review
    dbReviewsStore = dbReviewsStore.filter(r => r.id !== reviewId);
    setStoredData('hub_db_reviews', dbReviewsStore);
    
    // 2. Remove user from neighborhood (as requested)
    const userIdStr = reviewerId.toString();
    dbNeighborhoodMembersStore = dbNeighborhoodMembersStore.filter(m => m.user_id !== userIdStr);
    setStoredData('hub_db_neighbors', dbNeighborhoodMembersStore);
    
    // 3. Notify
    notificationsService.addNotification({
      userId: userIdStr,
      title: 'Account Removed',
      message: 'Your account has been removed from the neighborhood due to policy violations in your reviews.',
      type: 'system'
    });
    
    return Promise.resolve(true);
  },
  
  deleteReview: (id: number) => {
    dbReviewsStore = dbReviewsStore.filter(r => r.id !== id);
    setStoredData('hub_db_reviews', dbReviewsStore);
    return Promise.resolve(true);
  },
  
  banUser: (userId: number) => {
    const userIdStr = userId.toString();

    // 1. Delete user from main users store
    usersStore = usersStore.filter(u => u.id !== userIdStr);
    setStoredData('neighborhub_users', usersStore);

    // 2. Delete user from neighborhood members table
    dbNeighborhoodMembersStore = dbNeighborhoodMembersStore.filter(m => m.user_id !== userIdStr);
    setStoredData('hub_db_neighbors', dbNeighborhoodMembersStore);

    // 3. Clean up their posts
    dbPostsStore = dbPostsStore.filter(p => p.author_id !== userIdStr);
    setStoredData('hub_db_posts', dbPostsStore);

    // 4. Send notification
    notificationsService.addNotification({
      userId: userIdStr,
      title: 'Removed from Neighborhood',
      message: 'You have been removed from the neighborhood following a review of flagged content.',
      type: 'system'
    });

    return Promise.resolve(true);
  },
  
  clearAllData: () => {
    const keys = [
      'hub_db_posts', 'hub_db_alerts', 'hub_db_reports', 
      'hub_db_provider_apps', 'hub_db_events', 'hub_db_marketplace', 
      'hub_db_comments', 'hub_db_reviews', 'hub_db_neighbors'
    ];
    keys.forEach(k => localStorage.removeItem(k));
    window.location.reload();
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