export interface DbPost {
  idx: number;
  id: number;
  author_id: string | null;
  content: string;
  image: string | null;
  likes: number;
  category: string;
  is_flagged: boolean;
  flag_reason: string | null;
  moderation_status: string;
  neighborhod_id: number | null;
}

export interface DbAlert {
  idx: number;
  id: number;
  author_id: number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  severity: string;
  resolved: boolean;
  is_flagged: boolean;
  flag_reason: string | null;
  moderation_status: string;
}

export interface DbReport {
  idx: number;
  id: number;
  reporter_id: number;
  reported_item_id: number;
  reported_item_type: string;
  reason: string;
  description: string;
  status: string;
  timestamp: string;
}

export interface ProviderApplication {
  idx: number;
  id: number;
  user_id: number;
  category: string;
  experience: string;
  description: string;
}

export interface DbEvent {
  idx: number;
  id: number;
  organizer_id: number;
  neighborhood_id: number;
  title: string;
  description: string; // JSON string
  date: string;
  time: string;
  location: string;
  category: string;
  max_attendees: number | null;
  image: string | null;
  is_flagged: boolean;
  flag_reason: string | null;
  moderation_status: string;
}

export interface DbMarketplaceItem {
  idx: number;
  id: number;
  seller_id: number;
  title: string;
  description: string;
  price: string;
  condition: string;
  category: string;
  image: string | null;
  posted_date: string;
  status: string;
  is_flagged: boolean;
  flag_reason: string | null;
  moderation_status: string;
}

export interface DbComment {
  idx: number;
  id: number;
  author_id: number | null;
  post_id: number | null;
  content: string | null;
  time: string;
  is_flagged: boolean;
  flag_reason: string | null;
  moderation_status: string;
}

export interface DbReview {
  idx: number;
  id: number;
  reviewer_id: number | null;
  target_id: number;
  target_type: "user" | "service" | "marketplace_item" | "event";
  rating: number;
  comment: string;
  timestamp: string;
  is_flagged: boolean;
  flag_reason: string | null;
  moderation_status: string | null;
  created_at: string;
  neighborhod_id: number | null;
}

export interface DbNeighborhoodMember {
  idx: number;
  id: number;
  user_id: string;
  neighborhood_id: number;
  joined_date: string;
  status: string;
  verified_at: string | null;
  user_location_city: string | null;
  user_location_state: string | null;
}

export const dbPosts: DbPost[] = [
  { "idx": 0, "id": 1, "author_id": "1", "content": "Hello neighborhood!", "image": null, "likes": 0, "category": "General", "is_flagged": false, "flag_reason": null, "moderation_status": "approved", "neighborhod_id": null },
  { "idx": 1, "id": 2, "author_id": null, "content": "hi peeps", "image": null, "likes": 0, "category": "General", "is_flagged": false, "flag_reason": null, "moderation_status": "approved", "neighborhod_id": null },
  { "idx": 2, "id": 3, "author_id": null, "content": "hi peeps", "image": null, "likes": 0, "category": "General", "is_flagged": false, "flag_reason": null, "moderation_status": "approved", "neighborhod_id": null },
  { "idx": 3, "id": 4, "author_id": null, "content": "hi people", "image": null, "likes": 0, "category": "General", "is_flagged": false, "flag_reason": null, "moderation_status": "approved", "neighborhod_id": null },
  { "idx": 4, "id": 5, "author_id": "42", "content": "hamza nhi mil rha", "image": null, "likes": 0, "category": "General", "is_flagged": false, "flag_reason": null, "moderation_status": "approved", "neighborhod_id": null },
  { "idx": 5, "id": 6, "author_id": "42", "content": "Lye screenshot ", "image": null, "likes": 0, "category": "General", "is_flagged": false, "flag_reason": null, "moderation_status": "approved", "neighborhod_id": null },
  { "idx": 6, "id": 7, "author_id": "42", "content": "Heavy hamza", "image": null, "likes": 0, "category": "General", "is_flagged": false, "flag_reason": null, "moderation_status": "approved", "neighborhod_id": null },
  { "idx": 7, "id": 8, "author_id": "42", "content": "vxvxvcxvxc dvdssdfsdfdsfsd", "image": null, "likes": 0, "category": "General", "is_flagged": false, "flag_reason": null, "moderation_status": "approved", "neighborhod_id": null },
  { "idx": 8, "id": 9, "author_id": "42", "content": "sasfsdfsdfsdfds", "image": null, "likes": 0, "category": "General", "is_flagged": false, "flag_reason": null, "moderation_status": "approved", "neighborhod_id": null },
  { "idx": 9, "id": 10, "author_id": "42", "content": "xczxczxczxcx", "image": null, "likes": 0, "category": "General", "is_flagged": false, "flag_reason": null, "moderation_status": "approved", "neighborhod_id": 11 },
  { "idx": 10, "id": 11, "author_id": "42", "content": "PAKISTAN G", "image": null, "likes": 0, "category": "Event", "is_flagged": false, "flag_reason": null, "moderation_status": "approved", "neighborhod_id": 11 },
  { "idx": 11, "id": 12, "author_id": "1", "content": "This post contains hate speech.", "image": null, "likes": 0, "category": "General", "is_flagged": true, "flag_reason": "Inappropriate content", "moderation_status": "pending", "neighborhod_id": null }
];

export const dbAlerts: DbAlert[] = [
  { "idx": 0, "id": 1, "author_id": 1, "type": "security", "title": "issue is urgent", "description": "Unknown person seen near gate", "timestamp": "2026-04-07 22:54:38", "severity": "high", "resolved": false, "is_flagged": false, "flag_reason": null, "moderation_status": "approved" },
  { "idx": 1, "id": 2, "author_id": 42, "type": "announcement", "title": "Hamza is missing", "description": "Jisko bhi milaye boly irfan bula rha hn", "timestamp": "2026-05-07 07:20:48.697", "severity": "critical", "resolved": true, "is_flagged": false, "flag_reason": null, "moderation_status": "approved" },
  { "idx": 2, "id": 3, "author_id": 42, "type": "announcement", "title": "Abhi tak nhi Mila hamza", "description": "Jis ko bhi mily irfan sy rabta kry", "timestamp": "2026-05-07 18:33:16.389", "severity": "medium", "resolved": false, "is_flagged": false, "flag_reason": null, "moderation_status": "approved" }
];

export const dbReports: DbReport[] = [
  { "idx": 0, "id": 2, "reporter_id": 1, "reported_item_id": 10, "reported_item_type": "comment", "reason": "spam", "description": "This is spam content", "status": "pending", "timestamp": "2026-05-05 17:34:11.838" }
];

export const providerApplications: ProviderApplication[] = [
  { "idx": 0, "id": 2, "user_id": 999, "category": "Plumbing", "experience": "10 years of professional plumbing", "description": "I am a certified plumber looking to help the neighborhood." }
];

export const dbEvents: DbEvent[] = [
  { "idx": 0, "id": 1, "organizer_id": 11, "neighborhood_id": 4, "title": "Community BBQ & Picnic", "description": "{\"text\":\"Join us for a fun community BBQ at Oak Valley Park! Bring your family, friends, and your favorite side dish. Grills and drinks will be provided. Kids activities available.\",\"isPrivate\":false,\"invitedUserIds\":[]}", "date": "2026-05-06", "time": "14:00:00", "location": "Oak Valley Park - Pavilion Area", "category": "Community", "max_attendees": 50, "image": null, "is_flagged": false, "flag_reason": null, "moderation_status": "approved" },
  { "idx": 1, "id": 2, "organizer_id": 12, "neighborhood_id": 4, "title": "Morning Yoga in the Park", "description": "{\"text\":\"Start your weekend with a refreshing yoga session. All levels welcome! Bring your own mat. Session led by certified instructor Sarah.\",\"isPrivate\":false,\"invitedUserIds\":[]}", "date": "2026-05-12", "time": "07:30:00", "location": "Oak Valley Park - East Lawn", "category": "Sports", "max_attendees": 20, "image": null, "is_flagged": false, "flag_reason": null, "moderation_status": "approved" },
  { "idx": 2, "id": 3, "organizer_id": 11, "neighborhood_id": 4, "title": "Neighborhood Watch Meeting", "description": "{\"text\":\"Monthly neighborhood watch meeting to discuss safety updates, recent incidents, and improvement plans. All residents welcome.\",\"isPrivate\":false,\"invitedUserIds\":[]}", "date": "2026-05-19", "time": "19:00:00", "location": "Community Center - Room 101", "category": "Community", "max_attendees": null, "image": null, "is_flagged": false, "flag_reason": null, "moderation_status": "approved" },
  { "idx": 3, "id": 4, "organizer_id": 12, "neighborhood_id": 4, "title": "Private Book Club Meeting", "description": "{\"text\":\"This month we are reading \\\"The Midnight Library\\\" by Matt Haig. Snacks and coffee provided. RSVP required.\",\"isPrivate\":true,\"invitedUserIds\":[11,13]}", "date": "2026-05-12", "time": "18:30:00", "location": "Sarah's House - 456 Maple Street", "category": "Social", "max_attendees": 8, "image": null, "is_flagged": false, "flag_reason": null, "moderation_status": "approved" },
  { "idx": 4, "id": 5, "organizer_id": 13, "neighborhood_id": 4, "title": "Kids Soccer Tournament", "description": "{\"text\":\"Annual kids soccer tournament for ages 6-12. Teams of 5. Sign up your kids for a fun day of friendly competition!\",\"isPrivate\":false,\"invitedUserIds\":[]}", "date": "2026-06-04", "time": "10:00:00", "location": "Oak Valley Sports Field", "category": "Family", "max_attendees": 40, "image": null, "is_flagged": false, "flag_reason": null, "moderation_status": "approved" },
  { "idx": 5, "id": 6, "organizer_id": 10, "neighborhood_id": 4, "title": "BBQ", "description": "{\"text\":\"Chicken\",\"isPrivate\":false,\"invitedUserIds\":[]}", "date": "2026-05-05", "time": "23:15:00", "location": "Sammad House", "category": "Social", "max_attendees": null, "image": null, "is_flagged": false, "flag_reason": null, "moderation_status": "approved" },
  { "idx": 6, "id": 7, "organizer_id": 10, "neighborhood_id": 4, "title": "Sammad Wedding", "description": "{\"text\":\"Sammad Loves Her\",\"isPrivate\":false,\"invitedUserIds\":[]}", "date": "2026-05-05", "time": "23:20:00", "location": "Sammad House ", "category": "Family", "max_attendees": 84, "image": null, "is_flagged": false, "flag_reason": null, "moderation_status": "approved" },
  { "idx": 7, "id": 8, "organizer_id": 10, "neighborhood_id": 4, "title": "Sammad ", "description": "{\"text\":\"Party Party\",\"isPrivate\":true,\"invitedUserIds\":[11,12]}", "date": "2026-05-05", "time": "23:25:00", "location": "Sammad House", "category": "Other", "max_attendees": 100, "image": null, "is_flagged": false, "flag_reason": null, "moderation_status": "approved" },
  { "idx": 8, "id": 9, "organizer_id": 123748, "neighborhood_id": 3, "title": "Jest Party", "description": "Testing events", "date": "2026-12-25", "time": "18:00:00", "location": "Jest Lab", "category": "Social", "max_attendees": null, "image": null, "is_flagged": false, "flag_reason": null, "moderation_status": "active" },
  { "idx": 9, "id": 12, "organizer_id": 4, "neighborhood_id": 3, "title": "xzczx", "description": "zczxc", "date": "2026-05-13", "time": "12:36:00", "location": "zczx", "category": "Community", "max_attendees": null, "image": null, "is_flagged": false, "flag_reason": null, "moderation_status": "approved" },
  { "idx": 10, "id": 13, "organizer_id": 4, "neighborhood_id": 3, "title": "xzzxcx", "description": "xczxczxczx", "date": "2026-05-12", "time": "15:37:00", "location": "zxcxzczx", "category": "Community", "max_attendees": null, "image": null, "is_flagged": false, "flag_reason": null, "moderation_status": "approved" },
  { "idx": 11, "id": 14, "organizer_id": 4, "neighborhood_id": 3, "title": "Ifan", "description": "czczxcx", "date": "2026-05-06", "time": "23:42:00", "location": "xzc", "category": "Education", "max_attendees": null, "image": null, "is_flagged": false, "flag_reason": null, "moderation_status": "approved" },
  { "idx": 12, "id": 16, "organizer_id": 42, "neighborhood_id": 11, "title": "vxcvxcvx", "description": "cczxczxczx", "date": "2026-05-05", "time": "23:52:00", "location": "czxczxczx", "category": "Community", "max_attendees": null, "image": null, "is_flagged": false, "flag_reason": null, "moderation_status": "approved" },
  { "idx": 13, "id": 20, "organizer_id": 42, "neighborhood_id": 11, "title": "Hamzu ki Shaadi ", "description": "Popat bacchi require", "date": "2026-05-07", "time": "11:50:00", "location": "G-7", "category": "Family", "max_attendees": null, "image": null, "is_flagged": false, "flag_reason": null, "moderation_status": "approved" }
];

export const dbMarketplaceItems: DbMarketplaceItem[] = [
  { "idx": 0, "id": 1, "seller_id": 1, "title": "dummy", "description": "dummy", "price": "1000", "condition": "dummy", "category": "dummy", "image": null, "posted_date": "2026-05-05 17:07:41.052", "status": "active", "is_flagged": false, "flag_reason": null, "moderation_status": "approved" },
  { "idx": 1, "id": 2, "seller_id": 123748, "title": "Jest Drill", "description": "Power drill", "price": "20", "condition": "New", "category": "Tools", "image": null, "posted_date": "2026-05-05 20:27:54.408", "status": "active", "is_flagged": false, "flag_reason": null, "moderation_status": "active" },
  { "idx": 2, "id": 4, "seller_id": 42, "title": "Plumber", "description": "Yoooooooooooooooooooooo", "price": "1", "condition": "used", "category": "Furniture", "image": null, "posted_date": "2026-05-06 19:48:34.171", "status": "available", "is_flagged": false, "flag_reason": null, "moderation_status": "approved" }
];

export const dbComments: DbComment[] = [
  { "idx": 0, "id": 1, "author_id": null, "post_id": null, "content": null, "time": "2026-04-27 11:20:34", "is_flagged": false, "flag_reason": null, "moderation_status": "approved" },
  { "idx": 1, "id": 2, "author_id": 2, "post_id": 1, "content": "This is a spam comment", "time": "2026-05-05 17:34:11", "is_flagged": true, "flag_reason": "Spam", "moderation_status": "pending" }
];

export const dbReviews: DbReview[] = [
  {"idx":0,"id":11,"reviewer_id":42,"target_id":25,"target_type":"service","rating":3,"comment":"Ata jata kuch bhi hn isko aesy hi hn","timestamp":"2026-05-08 07:14:57.824126","is_flagged":true,"flag_reason":"harassed me","moderation_status":"pending","created_at":"2026-05-08 07:14:57.824126","neighborhod_id":11},
  {"idx":1,"id":13,"reviewer_id":42,"target_id":20,"target_type":"event","rating":5,"comment":"Whole class invited, except Irfan and Hassan ","timestamp":"2026-05-08 07:17:54.831886","is_flagged":false,"flag_reason":null,"moderation_status":null,"created_at":"2026-05-08 07:17:54.831886","neighborhod_id":11}
];

export const dbNeighborhoodMembers: DbNeighborhoodMember[] = [
  { "idx": 0, "id": 10, "user_id": "2", "neighborhood_id": 3, "joined_date": "2026-05-05 13:02:03.4", "status": "pending", "verified_at": null, "user_location_city": null, "user_location_state": null },
  { "idx": 1, "id": 11, "user_id": "3", "neighborhood_id": 3, "joined_date": "2026-05-05 13:13:18.647", "status": "pending", "verified_at": null, "user_location_city": null, "user_location_state": null },
  { "idx": 2, "id": 12, "user_id": "4", "neighborhood_id": 3, "joined_date": "2026-05-05 14:44:47.533", "status": "pending", "verified_at": null, "user_location_city": "بحریہ ٹاؤن", "user_location_state": "پنجاب" },
  { "idx": 3, "id": 13, "user_id": "5", "neighborhood_id": 3, "joined_date": "2026-05-05 15:33:05.839", "status": "pending", "verified_at": null, "user_location_city": "Islamabad", "user_location_state": "Islamabad Capital Territory" },
  { "idx": 4, "id": 17, "user_id": "6", "neighborhood_id": 3, "joined_date": "2026-05-05 16:24:18.973176", "status": "verified", "verified_at": "2026-05-05 16:57:03.443+00", "user_location_city": "Zone V", "user_location_state": "Islamabad Capital Territory" },
  { "idx": 5, "id": 25, "user_id": "7", "neighborhood_id": 3, "joined_date": "2026-05-05 17:30:58.24", "status": "pending", "verified_at": null, "user_location_city": null, "user_location_state": null },
  { "idx": 6, "id": 26, "user_id": "10", "neighborhood_id": 3, "joined_date": "2026-05-05 18:03:36.825", "status": "pending", "verified_at": null, "user_location_city": null, "user_location_state": null },
  { "idx": 7, "id": 27, "user_id": "11", "neighborhood_id": 4, "joined_date": "2026-05-05 18:07:26.739716", "status": "approved", "verified_at": null, "user_location_city": null, "user_location_state": null },
  { "idx": 8, "id": 28, "user_id": "12", "neighborhood_id": 4, "joined_date": "2026-05-05 18:07:27.068506", "status": "approved", "verified_at": null, "user_location_city": null, "user_location_state": null },
  { "idx": 9, "id": 30, "user_id": "14", "neighborhood_id": 11, "joined_date": "2026-05-05 18:07:27.722027", "status": "approved", "verified_at": null, "user_location_city": null, "user_location_state": null },
  { "idx": 10, "id": 33, "user_id": "36", "neighborhood_id": 11, "joined_date": "2026-05-06 10:29:36.868", "status": "pending", "verified_at": null, "user_location_city": null, "user_location_state": null }
];
