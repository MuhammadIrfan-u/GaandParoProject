// Mock Data Service for NeighborHub
// This simulates backend API calls with demo data

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
  verified: boolean;
  createdDate: string;
  coverPhoto?: string;
  settings: NeighborhoodSettings;
  guidelines: string;
}

export interface NeighborhoodSettings {
  enableMarketplace: boolean;
  enableResourceExchange: boolean;
  enablePublicAlerts: boolean;
  enableEvents: boolean;
  enableServices: boolean;
  requireVerification: boolean;
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

// Current user (simulated logged-in user)
export const currentUser: User = {
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

// Users
export const users: User[] = [
  currentUser,
  {
    id: 'user-2',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 (555) 234-5678',
    address: '456 Maple Ave, Oak Valley',
    avatar: 'SJ',
    verified: true,
    reputation: 4.9,
    joinedDate: '2023-11-20',
  },
  {
    id: 'user-3',
    name: 'Michael Chen',
    email: 'mchen@email.com',
    phone: '+1 (555) 345-6789',
    address: '789 Pine Road, Oak Valley',
    avatar: 'MC',
    verified: true,
    reputation: 4.7,
    joinedDate: '2024-02-10',
  },
  {
    id: 'user-4',
    name: 'Emily Rodriguez',
    email: 'emily.r@email.com',
    phone: '+1 (555) 456-7890',
    address: '321 Birch Lane, Oak Valley',
    avatar: 'ER',
    verified: true,
    reputation: 4.6,
    joinedDate: '2023-12-05',
  },
  {
    id: 'user-5',
    name: 'David Kim',
    email: 'dkim@email.com',
    phone: '+1 (555) 567-8901',
    address: '654 Cedar Court, Oak Valley',
    avatar: 'DK',
    verified: false,
    reputation: 4.4,
    joinedDate: '2025-03-01',
  },
];

// Posts
export const posts: Post[] = [
  {
    id: 'post-1',
    authorId: 'user-2',
    author: 'Sarah Johnson',
    avatar: 'SJ',
    verified: true,
    time: '2h ago',
    content: 'Found a lost golden retriever near Oak Street Park. Very friendly, wearing a blue collar. Anyone know the owner?',
    likes: 24,
    comments: [],
    category: 'Lost & Found',
    categoryColor: 'bg-orange-100 text-orange-700',
    likedBy: [],
  },
  {
    id: 'post-2',
    authorId: 'user-3',
    author: 'Michael Chen',
    avatar: 'MC',
    verified: true,
    time: '4h ago',
    content: 'Reminder: Neighborhood clean-up event this Saturday at 9 AM. Let\'s make our community beautiful! 🌳',
    likes: 42,
    comments: [],
    category: 'Event',
    categoryColor: 'bg-blue-100 text-blue-700',
    likedBy: [],
  },
  {
    id: 'post-3',
    authorId: 'user-4',
    author: 'Emily Rodriguez',
    avatar: 'ER',
    verified: true,
    time: '6h ago',
    content: 'Looking for recommendations for a reliable plumber. Had a leak in the basement. Thanks!',
    likes: 18,
    comments: [],
    category: 'Question',
    categoryColor: 'bg-purple-100 text-purple-700',
    likedBy: [],
  },
];

// Marketplace Items
export const marketplaceItems: MarketplaceItem[] = [
  {
    id: 'market-1',
    sellerId: 'user-2',
    seller: 'Sarah Johnson',
    sellerAvatar: 'SJ',
    verified: true,
    title: 'Vintage Bookshelf',
    description: 'Beautiful oak bookshelf in excellent condition. 6ft tall, 3ft wide. Perfect for home office.',
    price: 150,
    condition: 'used',
    category: 'Furniture',
    postedDate: '2 days ago',
    status: 'available',
  },
  {
    id: 'market-2',
    sellerId: 'user-3',
    seller: 'Michael Chen',
    sellerAvatar: 'MC',
    verified: true,
    title: 'Kids Bicycle',
    description: 'Red kids bicycle, 20-inch wheels. My son outgrew it. Well maintained.',
    price: 75,
    condition: 'like-new',
    category: 'Sports & Outdoors',
    postedDate: '1 day ago',
    status: 'available',
  },
  {
    id: 'market-3',
    sellerId: 'user-4',
    seller: 'Emily Rodriguez',
    sellerAvatar: 'ER',
    verified: true,
    title: 'Coffee Maker',
    description: 'Barely used Keurig coffee maker. Received as a gift but prefer traditional coffee.',
    price: 45,
    condition: 'new',
    category: 'Appliances',
    postedDate: '3 days ago',
    status: 'available',
  },
  {
    id: 'market-4',
    sellerId: 'user-5',
    seller: 'David Kim',
    sellerAvatar: 'DK',
    verified: false,
    title: 'Lawn Mower',
    description: 'Electric lawn mower, works great. Moving to apartment so no longer needed.',
    price: 200,
    condition: 'used',
    category: 'Garden',
    postedDate: '5 days ago',
    status: 'available',
  },
];

// Services
export const services: Service[] = [
  {
    id: 'service-1',
    providerId: 'user-2',
    provider: 'Sarah Johnson',
    providerAvatar: 'SJ',
    verified: true,
    category: 'Plumbing',
    title: 'Professional Plumbing Services',
    description: 'Licensed plumber with 15 years experience. Available for repairs, installations, and emergencies.',
    rating: 4.9,
    reviewCount: 34,
    price: '$80-150/hr',
    availability: 'Mon-Sat, 8AM-6PM',
  },
  {
    id: 'service-2',
    providerId: 'user-3',
    provider: 'Michael Chen',
    providerAvatar: 'MC',
    verified: true,
    category: 'Landscaping',
    title: 'Lawn Care & Landscaping',
    description: 'Full service lawn maintenance, garden design, and seasonal cleanup.',
    rating: 4.8,
    reviewCount: 28,
    price: '$50-100/hr',
    availability: 'Tue-Sun, 7AM-5PM',
  },
  {
    id: 'service-3',
    providerId: 'user-4',
    provider: 'Emily Rodriguez',
    providerAvatar: 'ER',
    verified: true,
    category: 'Pet Care',
    title: 'Dog Walking & Pet Sitting',
    description: 'Reliable pet care services. Your furry friends in good hands!',
    rating: 5.0,
    reviewCount: 52,
    price: '$25-40/visit',
    availability: 'Daily, Flexible',
  },
  {
    id: 'service-4',
    providerId: 'user-5',
    provider: 'David Kim',
    providerAvatar: 'DK',
    verified: false,
    category: 'Electrical',
    title: 'Electrical Repairs',
    description: 'Certified electrician for all your electrical needs.',
    rating: 4.6,
    reviewCount: 19,
    price: '$90-180/hr',
    availability: 'Mon-Fri, 9AM-5PM',
  },
];

// Events
export const events: Event[] = [
  {
    id: 'event-1',
    organizerId: 'user-3',
    organizer: 'Michael Chen',
    organizerAvatar: 'MC',
    title: 'Neighborhood Clean-Up Day',
    description: 'Join us for our monthly community clean-up! We\'ll provide gloves, bags, and refreshments.',
    date: '2026-03-22',
    time: '9:00 AM',
    location: 'Oak Valley Park',
    category: 'Community',
    attendees: ['user-1', 'user-2', 'user-4'],
    maxAttendees: 30,
  },
  {
    id: 'event-2',
    organizerId: 'user-2',
    organizer: 'Sarah Johnson',
    organizerAvatar: 'SJ',
    title: 'Community Garage Sale',
    description: 'Annual neighborhood garage sale. Set up your table and sell items you no longer need!',
    date: '2026-03-28',
    time: '8:00 AM',
    location: 'Oak Valley Community Center',
    category: 'Social',
    attendees: ['user-1', 'user-3'],
    maxAttendees: 50,
  },
  {
    id: 'event-3',
    organizerId: 'user-4',
    organizer: 'Emily Rodriguez',
    organizerAvatar: 'ER',
    title: 'Kids Easter Egg Hunt',
    description: 'Fun Easter egg hunt for kids ages 3-10. Prizes and treats for all participants!',
    date: '2026-04-05',
    time: '10:00 AM',
    location: 'Oak Street Park',
    category: 'Family',
    attendees: ['user-1', 'user-2', 'user-3', 'user-5'],
    maxAttendees: 40,
  },
];

// Alerts
export const alerts: Alert[] = [
  {
    id: 'alert-1',
    authorId: 'user-1',
    author: 'Alex Thompson',
    type: 'security',
    title: 'Suspicious Vehicle Reported',
    description: 'White van with no plates seen circling the neighborhood multiple times this evening. Please be vigilant and report to local authorities if seen.',
    timestamp: '2026-03-20T18:30:00',
    severity: 'high',
    resolved: false,
  },
  {
    id: 'alert-2',
    authorId: 'user-2',
    author: 'Sarah Johnson',
    type: 'lost-found',
    title: 'Lost Golden Retriever',
    description: 'Lost dog near Oak Street Park. Golden retriever, blue collar, answers to "Max". Please contact if found.',
    timestamp: '2026-03-20T14:00:00',
    severity: 'medium',
    resolved: false,
  },
  {
    id: 'alert-3',
    authorId: 'user-1',
    author: 'Alex Thompson',
    type: 'announcement',
    title: 'Water Main Maintenance',
    description: 'Scheduled water maintenance on Oak Valley Blvd tomorrow 9AM-12PM. Some areas may experience low pressure.',
    timestamp: '2026-03-19T10:00:00',
    severity: 'low',
    resolved: true,
  },
];

// Conversations
export const conversations: Conversation[] = [
  {
    id: 'conv-1',
    participantIds: ['user-1', 'user-2'],
    participants: ['Sarah Johnson'],
    participantAvatars: ['SJ'],
    lastMessage: 'Thanks for the plumbing recommendation!',
    lastMessageTime: '10m ago',
    unreadCount: 2,
    isGroup: false,
  },
  {
    id: 'conv-2',
    participantIds: ['user-1', 'user-3'],
    participants: ['Michael Chen'],
    participantAvatars: ['MC'],
    lastMessage: 'See you at the clean-up event!',
    lastMessageTime: '1h ago',
    unreadCount: 0,
    isGroup: false,
  },
  {
    id: 'conv-3',
    participantIds: ['user-1', 'user-2', 'user-3', 'user-4'],
    participants: ['Sarah Johnson', 'Michael Chen', 'Emily Rodriguez'],
    participantAvatars: ['SJ', 'MC', 'ER'],
    lastMessage: 'Great idea for the community event!',
    lastMessageTime: '3h ago',
    unreadCount: 1,
    isGroup: true,
    groupName: 'Community Planning',
  },
];

// Messages
export const messages: { [conversationId: string]: Message[] } = {
  'conv-1': [
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'user-2',
      sender: 'Sarah Johnson',
      senderAvatar: 'SJ',
      content: 'Hi! I saw your post about needing a plumber.',
      timestamp: '2026-03-20T10:00:00',
      read: true,
    },
    {
      id: 'msg-2',
      conversationId: 'conv-1',
      senderId: 'user-1',
      sender: 'Alex Thompson',
      senderAvatar: 'AT',
      content: 'Yes! Do you have any recommendations?',
      timestamp: '2026-03-20T10:05:00',
      read: true,
    },
    {
      id: 'msg-3',
      conversationId: 'conv-1',
      senderId: 'user-2',
      sender: 'Sarah Johnson',
      senderAvatar: 'SJ',
      content: 'I know a great local plumber. Let me send you their contact info.',
      timestamp: '2026-03-20T10:07:00',
      read: true,
    },
    {
      id: 'msg-4',
      conversationId: 'conv-1',
      senderId: 'user-2',
      sender: 'Sarah Johnson',
      senderAvatar: 'SJ',
      content: 'Thanks for the plumbing recommendation!',
      timestamp: '2026-03-20T11:50:00',
      read: false,
    },
  ],
  'conv-2': [
    {
      id: 'msg-5',
      conversationId: 'conv-2',
      senderId: 'user-3',
      sender: 'Michael Chen',
      senderAvatar: 'MC',
      content: 'Are you coming to the clean-up event on Saturday?',
      timestamp: '2026-03-20T09:00:00',
      read: true,
    },
    {
      id: 'msg-6',
      conversationId: 'conv-2',
      senderId: 'user-1',
      sender: 'Alex Thompson',
      senderAvatar: 'AT',
      content: 'Absolutely! What time should I arrive?',
      timestamp: '2026-03-20T09:15:00',
      read: true,
    },
    {
      id: 'msg-7',
      conversationId: 'conv-2',
      senderId: 'user-3',
      sender: 'Michael Chen',
      senderAvatar: 'MC',
      content: 'We start at 9 AM. See you at the clean-up event!',
      timestamp: '2026-03-20T10:00:00',
      read: true,
    },
  ],
};

// Notifications
export const notifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-1',
    type: 'event',
    title: 'Event Reminder',
    message: 'Neighborhood Clean-Up Day starts in 2 days',
    timestamp: '2026-03-20T08:00:00',
    read: false,
    actionUrl: '/events',
  },
  {
    id: 'notif-2',
    userId: 'user-1',
    type: 'message',
    title: 'New Message',
    message: 'Sarah Johnson sent you a message',
    timestamp: '2026-03-20T11:50:00',
    read: false,
    actionUrl: '/messages',
  },
  {
    id: 'notif-3',
    userId: 'user-1',
    type: 'alert',
    title: 'Security Alert',
    message: 'Suspicious vehicle reported in Oak Valley',
    timestamp: '2026-03-20T18:30:00',
    read: false,
    actionUrl: '/alerts',
  },
  {
    id: 'notif-4',
    userId: 'user-1',
    type: 'like',
    title: 'Post Interaction',
    message: 'Michael Chen liked your post',
    timestamp: '2026-03-20T15:00:00',
    read: true,
  },
];

// Reviews
export const reviews: Review[] = [
  {
    id: 'review-1',
    reviewerId: 'user-1',
    reviewer: 'Alex Thompson',
    reviewerAvatar: 'AT',
    targetId: 'service-1',
    targetType: 'service',
    rating: 5,
    comment: 'Excellent service! Fixed my leaky faucet quickly and professionally.',
    timestamp: '2026-03-15T14:00:00',
  },
  {
    id: 'review-2',
    reviewerId: 'user-3',
    reviewer: 'Michael Chen',
    reviewerAvatar: 'MC',
    targetId: 'service-3',
    targetType: 'service',
    rating: 5,
    comment: 'Emily is amazing with my dogs! Highly recommend.',
    timestamp: '2026-03-18T10:00:00',
  },
];

// Analytics Data
export const analyticsData = {
  userGrowth: [
    { month: 'Jan', users: 150 },
    { month: 'Feb', users: 180 },
    { month: 'Mar', users: 248 },
  ],
  activityStats: {
    totalPosts: 456,
    totalEvents: 23,
    totalMarketplace: 67,
    totalServices: 34,
  },
  engagement: [
    { day: 'Mon', posts: 12, events: 2 },
    { day: 'Tue', posts: 15, events: 1 },
    { day: 'Wed', posts: 18, events: 3 },
    { day: 'Thu', posts: 14, events: 2 },
    { day: 'Fri', posts: 20, events: 4 },
    { day: 'Sat', posts: 25, events: 5 },
    { day: 'Sun', posts: 22, events: 3 },
  ],
  topCategories: [
    { category: 'Questions', count: 145 },
    { category: 'Events', count: 89 },
    { category: 'Lost & Found', count: 56 },
    { category: 'Announcements', count: 78 },
  ],
};

// Mock Service Requests
export const serviceRequests: ServiceRequest[] = [
  {
    id: 'req-1',
    userId: 'user-1',
    serviceId: 'service-1',
    serviceName: 'Professional Plumbing Services',
    provider: 'Sarah Johnson',
    status: 'pending',
    requestDate: '2026-03-20',
    description: 'Need help fixing a leaky faucet in the kitchen',
  },
  {
    id: 'req-2',
    userId: 'user-1',
    serviceId: 'service-3',
    serviceName: 'Dog Walking & Pet Sitting',
    provider: 'Emily Rodriguez',
    status: 'accepted',
    requestDate: '2026-03-18',
    scheduledDate: '2026-03-22',
    description: 'Need dog walking service for 2 weeks while on vacation',
  },
];

// Neighborhoods
export const neighborhoods: Neighborhood[] = [
  {
    id: 'neighborhood-1',
    name: 'Oak Valley Community',
    city: 'Springfield',
    state: 'NY',
    description: 'A vibrant residential community with parks, schools, and local amenities.',
    primaryLandmark: 'Oak Valley Park',
    population: 248,
    verified: true,
    leadId: 'user-1',
    leadName: 'Alex Thompson',
    createdDate: '2024-01-15',
    coverPhoto: 'https://example.com/oak-valley-park.jpg',
    settings: {
      enableMarketplace: true,
      enableResourceExchange: true,
      enablePublicAlerts: true,
      enableEvents: true,
      enableServices: true,
      requireVerification: true,
    },
    guidelines: `# Community Guidelines

Welcome to Oak Valley Community! Please follow these guidelines:

1. Be respectful and courteous to all neighbors
2. Keep noise levels reasonable, especially after 10 PM
3. Dispose of trash properly and maintain your property
4. Report suspicious activity to community leaders
5. Participate in community events and initiatives

Together, we make Oak Valley a great place to live!`,
  },
  {
    id: 'neighborhood-2',
    name: 'Maple Heights',
    city: 'Springfield',
    state: 'NY',
    description: 'Quiet suburban neighborhood with tree-lined streets.',
    primaryLandmark: 'Maple Community Center',
    population: 156,
    verified: true,
    leadId: 'user-2',
    leadName: 'Sarah Johnson',
    createdDate: '2024-02-10',
    settings: {
      enableMarketplace: true,
      enableResourceExchange: false,
      enablePublicAlerts: true,
      enableEvents: true,
      enableServices: true,
      requireVerification: true,
    },
    guidelines: 'Please be respectful of your neighbors and follow all community rules.',
  },
];

// Neighborhood Proposals
export const neighborhoodProposals: NeighborhoodProposal[] = [
  {
    id: 'proposal-1',
    proposerId: 'user-3',
    proposerName: 'Michael Chen',
    name: 'Pine Grove Community',
    city: 'Springfield',
    state: 'NY',
    description: 'New residential area near Pine Grove Elementary School',
    primaryLandmark: 'Pine Grove Elementary',
    status: 'pending',
    submittedDate: '2026-03-18',
  },
];

// Simulated current location
export const currentLocation = {
  lat: 40.7135,
  lng: -74.0040,
};