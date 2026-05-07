export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  verified: boolean;
  reputation: number;
  joinedDate: string;
  bio?: string;
  isAdmin?: boolean;
  neighborhoodId?: number;
  isProvider?: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  author: string;
  avatar: string;
  verified: boolean;
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: Comment[];
  category: string;
  categoryColor: string;
  likedBy: string[];
}

export interface Comment {
  id: string;
  authorId: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
}

export interface MarketplaceItem {
  id: string;
  sellerId: string;
  seller: string;
  sellerAvatar: string;
  verified: boolean;
  title: string;
  description: string;
  price: number;
  condition: 'new' | 'used' | 'like-new';
  category: string;
  image?: string;
  postedDate: string;
  status: 'available' | 'sold' | 'pending';
}

export interface Service {
  id: string;
  providerId: string;
  provider: string;
  providerAvatar: string;
  verified: boolean;
  category: string;
  title: string;
  description: string;
  rating: number;
  reviewCount: number;
  price: string;
  availability: string;
  status?: 'active' | 'inactive';
}

export interface ServiceRequest {
  id: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  provider: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  requestDate: string;
  scheduledDate?: string;
  description: string;
}

export interface Event {
  id: string;
  organizerId: string;
  organizer: string;
  organizerAvatar: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  attendees: string[];
  maxAttendees?: number;
  image?: string;
}

export interface Alert {
  id: string;
  authorId: string;
  author: string;
  type: 'security' | 'emergency' | 'lost-found' | 'announcement';
  title: string;
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participants: string[];
  participantAvatars: string[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedItemId: string;
  reportedItemType: 'post' | 'user' | 'message' | 'marketplace';
  reason: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  timestamp: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewer: string;
  reviewerAvatar: string;
  targetId: string;
  targetType: 'user' | 'service';
  rating: number;
  comment: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface NeighborhoodSettings {
  enableMarketplace: boolean;
  enableResourceExchange: boolean;
  enablePublicAlerts: boolean;
  enableEvents: boolean;
  enableServices: boolean;
  requireVerification: boolean;
}

export interface Neighborhood {
  id: string;
  name: string;
  city: string;
  state: string;
  description: string;
  population: number;
  primaryLandmark: string;
  leadId: string;
  leadName: string;
  adminId?: string;
  verified: boolean;
  createdDate: string;
  coverPhoto?: string;
  logo?: string;
  settings: NeighborhoodSettings;
  guidelines: string;
}

export interface NeighborhoodProposal {
  id: string;
  proposerId: string;
  proposerName: string;
  name: string;
  city: string;
  state: string;
  description: string;
  primaryLandmark: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string;
  reviewedDate?: string;
  reviewNotes?: string;
}

export interface AnalyticsData {
  userGrowth: { month: string; users: number }[];
  activityStats: {
    totalPosts: number;
    totalEvents: number;
    totalMarketplace: number;
    totalServices: number;
  };
  engagement: { day: string; posts: number; events: number }[];
  topCategories: { category: string; count: number }[];
}

export interface Location {
  lat: number;
  lng: number;
}

export interface ProviderApplication {
  id: string;
  userId: string;
  fullName: string;
  experience: string;
  category: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string;
}
