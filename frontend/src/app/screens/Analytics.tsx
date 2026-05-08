import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Users, TrendingUp, Calendar, ShoppingBag, Shield, MapPin, Search, Star, AlertTriangle, Briefcase, FileText, MessageSquare, Clock, Trash2, Flag, CheckCircle, XCircle, Tag, Activity, UserCheck } from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Neighborhood, User, Review, ServiceRequest } from "../services/mockData";
import { DbPost, DbAlert, DbReport, DbEvent, DbMarketplaceItem, DbComment, ProviderApplication, DbReview } from "../services/dbData";
import { usersService, neighborhoodsService, reviewsService, servicesService, notificationsService, dbService } from "../services/storage";

export default function Analytics() {
  const navigate = useNavigate();

  const [usersCount, setUsersCount] = useState<number | string>("...");
  const [postsCount, setPostsCount] = useState<number | string>("...");
  const [eventsCount, setEventsCount] = useState<number | string>("...");
  const [marketplaceCount, setMarketplaceCount] = useState<number | string>("...");
  const [servicesCount, setServicesCount] = useState<number | string>("...");
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [requestsList, setRequestsList] = useState<ServiceRequest[]>([]);

  // Real DB State
  const [dbPosts, setDbPosts] = useState<DbPost[]>([]);
  const [dbEvents, setDbEvents] = useState<DbEvent[]>([]);
  const [dbMarketplace, setDbMarketplace] = useState<DbMarketplaceItem[]>([]);
  const [dbReports, setDbReports] = useState<DbReport[]>([]);
  const [dbAlerts, setDbAlerts] = useState<DbAlert[]>([]);
  const [dbComments, setDbComments] = useState<DbComment[]>([]);
  const [dbReviews, setDbReviews] = useState<DbReview[]>([]);
  const [providerApps, setProviderApps] = useState<ProviderApplication[]>([]);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          users, neighborhoodsData, allReviews, allRequests,
          posts, events, items, reports, alerts, comments, pApps, reviews
        ] = await Promise.all([
          usersService.getUsers(),
          neighborhoodsService.getNeighborhoods(),
          reviewsService.getAllReviews(),
          servicesService.getAllRequests(),
          dbService.getPosts(),
          dbService.getEvents(),
          dbService.getMarketplaceItems(),
          dbService.getReports(),
          dbService.getAlerts(),
          dbService.getComments(),
          dbService.getProviderApplications(),
          dbService.getReviews()
        ]);

        setUsersCount(users.length);
        setNeighborhoods(neighborhoodsData);
        setAllUsers(users);
        setReviewsList(allReviews);
        setRequestsList(allRequests);

        // Set DB data
        setDbPosts(posts);
        setDbEvents(events);
        setDbMarketplace(items);
        setDbReports(reports);
        setDbAlerts(alerts);
        setDbComments(comments);
        setDbReviews(reviews);
        setProviderApps(pApps);

        setPostsCount(posts.length);
        setEventsCount(events.length);
        setMarketplaceCount(items.length);
        // setCommentsCount(comments.length); // Redundant, UI uses dbComments.length directly

      } catch (error) {
        console.error("Failed to load analytics data", error);
      }
    };

    loadData();
  }, []);

  const stats = [
    { icon: Users, label: "Total Users", value: usersCount, color: "bg-blue-500" },
    { icon: TrendingUp, label: "Posts", value: dbPosts.length, color: "bg-green-500" },
    { icon: MessageSquare, label: "Comments", value: dbComments.length, color: "bg-indigo-500" },
    { icon: Calendar, label: "Events", value: dbEvents.length, color: "bg-purple-500" },
  ];

  // Calculate dynamic top categories from dbPosts
  const topCategories = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    dbPosts.forEach(post => {
      categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
    });

    return Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5
  }, [dbPosts]);

  // Event Statistics
  const eventStats = useMemo(() => {
    const now = new Date();
    return {
      ongoing: dbEvents.filter(e => {
        const eventDate = new Date(e.date + 'T' + e.time);
        const duration = 2 * 60 * 60 * 1000; // Assume 2 hours duration
        return now >= eventDate && now <= new Date(eventDate.getTime() + duration);
      }).length,
      scheduled: dbEvents.filter(e => new Date(e.date + 'T' + e.time) > now).length,
      past: dbEvents.filter(e => {
        const eventDate = new Date(e.date + 'T' + e.time);
        const duration = 2 * 60 * 60 * 1000;
        return now > new Date(eventDate.getTime() + duration);
      }).length,
    };
  }, [dbEvents]);

  // Marketplace Statistics
  const marketStats = useMemo(() => {
    return {
      active: dbMarketplace.filter(i => i.status === 'active').length,
      available: dbMarketplace.filter(i => i.status === 'available').length,
      sold: dbMarketplace.filter(i => i.status === 'sold').length,
    };
  }, [dbMarketplace]);

  // Reports Stats Breakdown
  const reportStats = useMemo(() => {
    const counts: Record<string, number> = { pending: 0, reviewing: 0, resolved: 0, dismissed: 0 };
    dbReports.forEach(req => {
      if (counts[req.status] !== undefined) {
        counts[req.status]++;
      }
    });
    return counts;
  }, [dbReports]);

  // Flagged Content
  const flaggedContent = useMemo(() => {
    return {
      posts: dbPosts.filter(p => p.is_flagged).length,
      alerts: dbAlerts.filter(a => a.is_flagged).length,
      events: dbEvents.filter(e => e.is_flagged).length,
      items: dbMarketplace.filter(i => i.is_flagged).length,
      comments: dbComments.filter(c => c.is_flagged).length,
      reviews: dbReviews.filter(r => r.is_flagged).length,
    };
  }, [dbPosts, dbAlerts, dbEvents, dbMarketplace, dbComments, dbReviews]);

  const avgReviewRating = useMemo(() => {
    if (reviewsList.length === 0) return 0;
    const sum = reviewsList.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviewsList.length).toFixed(1);
  }, [reviewsList]);

  const handleResolveReport = async (reportId: number, action: 'allow' | 'delete') => {
    try {
      await dbService.resolveReport(reportId, action);
      // Refresh data
      const reports = await dbService.getReports();
      setDbReports(reports);

      // Also refresh the items that might have been deleted
      const [posts, alerts, items, comments] = await Promise.all([
        dbService.getPosts(),
        dbService.getAlerts(),
        dbService.getMarketplaceItems(),
        dbService.getComments()
      ]);
      setDbPosts(posts);
      setDbAlerts(alerts);
      setDbMarketplace(items);
      setDbComments(comments);

    } catch (error) {
      console.error("Failed to resolve report", error);
    }
  };

  const handleApproveProvider = async (appId: number) => {
    try {
      await dbService.approveProviderApplication(appId);
      const apps = await dbService.getProviderApplications();
      setProviderApps(apps);
    } catch (error) {
      console.error("Failed to approve provider", error);
    }
  };

  const handleDeleteReview = async (id: number) => {
    try {
      await dbService.deleteReview(id);
      const reviews = await dbService.getReviews();
      setDbReviews(reviews);
    } catch (error) {
      console.error("Failed to delete review", error);
    }
  };

  const handleBanUser = async (userId: number) => {
    try {
      await dbService.banUser(userId);
      // Refresh users and related data
      const [users, posts, reviews] = await Promise.all([
        usersService.getUsers(),
        dbService.getPosts(),
        dbService.getReviews()
      ]);
      setAllUsers(users);
      setDbPosts(posts);
      setDbReviews(reviews);
    } catch (error) {
      console.error("Failed to ban user", error);
    }
  };

  const getTargetItemName = (type: string, id: number) => {
    if (type === 'user') {
      const u = allUsers.find(user => user.id === id.toString());
      return u ? u.name : `User #${id}`;
    }
    if (type === 'marketplace_item') {
      const item = dbMarketplace.find(i => i.id === id);
      return item ? item.title : `Item #${id}`;
    }
    if (type === 'service') {
      // For mock simplicity, we'll just return the type and ID
      return `Service #${id}`;
    }
    return `Item #${id}`;
  };

  const latestPosts = useMemo(() => {
    return [...dbPosts].sort((a, b) => b.id - a.id).slice(0, 5);
  }, [dbPosts]);

  // Prepare chart data for Neighborhoods Population
  const populationChartData = useMemo(() => {
    return neighborhoods.map(n => ({
      name: n.name.length > 15 ? n.name.substring(0, 15) + '...' : n.name,
      population: n.population
    })).sort((a, b) => b.population - a.population).slice(0, 10);
  }, [neighborhoods]);

  // Filter neighborhoods based on search
  const filteredNeighborhoods = useMemo(() => {
    if (!searchQuery) return neighborhoods;
    const lowerQuery = searchQuery.toLowerCase();
    return neighborhoods.filter(n =>
      n.name.toLowerCase().includes(lowerQuery) ||
      n.city.toLowerCase().includes(lowerQuery) ||
      n.state.toLowerCase().includes(lowerQuery) ||
      n.leadName.toLowerCase().includes(lowerQuery)
    );
  }, [neighborhoods, searchQuery]);

  // Users Ranked by Reputation (User Trust)
  const rankedUsers = useMemo(() => {
    return [...allUsers].sort((a, b) => b.reputation - a.reputation).slice(0, 10);
  }, [allUsers]);

  // Service Request Stats Breakdown
  const serviceRequestStats = useMemo(() => {
    const counts: Record<string, number> = { pending: 0, accepted: 0, completed: 0, cancelled: 0 };
    requestsList.forEach(req => {
      if (counts[req.status] !== undefined) {
        counts[req.status]++;
      }
    });
    return counts;
  }, [requestsList]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => dbService.clearAllData()}
              className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
            >
              RESET DATA
            </button>
            <h1 className="text-xl font-semibold">Community Analytics</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 border border-border shadow-sm">
              <div className={`${stat.color} rounded-xl w-12 h-12 flex items-center justify-center text-white mb-3`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Dynamic Chart: Neighborhood Populations */}
        {populationChartData.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-border mb-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Top Neighborhood Populations</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={populationChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="population" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Categories and Extra Stats row */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              Top Post Categories
            </h3>
            {topCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No posts data available.</p>
            ) : (
              <div className="space-y-4">
                {topCategories.map((category) => (
                  <div key={category.category}>
                    <div className="flex items-center justify-between mb-1.5 text-sm font-medium">
                      <span>{category.category}</span>
                      <span className="text-muted-foreground">{category.count} posts</span>
                    </div>
                    <div className="bg-muted rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-purple-500 rounded-full h-full transition-all duration-700 ease-out"
                        style={{ width: `${Math.min(100, (category.count / topCategories[0].count) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-orange-500" />
                Services & Reviews
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-medium">Total Services Listed</span>
                  <span className="text-base font-bold">{servicesCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-medium">Total Service Requests</span>
                  <span className="text-base font-bold">{requestsList.length}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <div className="bg-orange-50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-orange-600">{serviceRequestStats.pending}</div>
                    <div className="text-[10px] text-orange-800 uppercase tracking-wider font-semibold">Pending</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-blue-600">{serviceRequestStats.accepted}</div>
                    <div className="text-[10px] text-blue-800 uppercase tracking-wider font-semibold">Accepted</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-green-600">{serviceRequestStats.completed}</div>
                    <div className="text-[10px] text-green-800 uppercase tracking-wider font-semibold">Done</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-gray-600">{serviceRequestStats.cancelled}</div>
                    <div className="text-[10px] text-gray-800 uppercase tracking-wider font-semibold">Canceled</div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t pt-3 mt-1">
                  <span className="text-sm text-muted-foreground font-medium">Total Reviews</span>
                  <div className="flex items-center gap-1">
                    <span className="text-base font-bold">{reviewsList.length}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-medium">Avg Review Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-base font-bold">{avgReviewRating}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Moderation Summary
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center p-2 bg-red-50 rounded-xl">
                  <div className="text-xl font-bold text-red-600">{flaggedContent.posts + flaggedContent.comments}</div>
                  <div className="text-[10px] text-red-800 uppercase font-bold">Flagged</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded-xl">
                  <div className="text-xl font-bold text-yellow-600">{dbPosts.filter(p => p.moderation_status === 'pending').length}</div>
                  <div className="text-[10px] text-yellow-800 uppercase font-bold">Pending</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-xl">
                  <div className="text-xl font-bold text-green-600">{dbPosts.filter(p => p.moderation_status === 'approved').length}</div>
                  <div className="text-[10px] text-green-800 uppercase font-bold">Approved</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reports Resolution Rate</span>
                  <span className="font-bold text-emerald-600">
                    {dbReports.length > 0 ? ((reportStats.resolved / dbReports.length) * 100).toFixed(0) : 100}%
                  </span>
                </div>
                <div className="bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${dbReports.length > 0 ? (reportStats.resolved / dbReports.length) * 100 : 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events Analysis */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Events Analysis
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{eventStats.ongoing}</div>
                <div className="text-xs text-muted-foreground">Ongoing</div>
              </div>
              <div className="text-center border-x border-border">
                <div className="text-2xl font-bold text-blue-600">{eventStats.scheduled}</div>
                <div className="text-xs text-muted-foreground">Scheduled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-500">{eventStats.past}</div>
                <div className="text-xs text-muted-foreground">Past</div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Category Breakdown</h4>
              {Array.from(new Set(dbEvents.map(e => e.category))).slice(0, 4).map(cat => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm">{cat}</span>
                  <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    {dbEvents.filter(e => e.category === cat).length}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Marketplace Analysis */}
          <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-500" />
              Marketplace Analysis
            </h3>
            <div className="flex items-center gap-6 mb-6">
              <div className="flex-1">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Available</span>
                        <span className="font-bold">{marketStats.available + marketStats.active}</span>
                      </div>
                      <div className="bg-muted h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${((marketStats.available + marketStats.active) / dbMarketplace.length) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Sold</span>
                        <span className="font-bold">{marketStats.sold}</span>
                      </div>
                      <div className="bg-muted h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${(marketStats.sold / dbMarketplace.length) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-24 h-24 flex items-center justify-center bg-indigo-50 rounded-full border-4 border-white shadow-inner">
                <div className="text-center">
                  <div className="text-xl font-bold text-indigo-600">{dbMarketplace.length}</div>
                  <div className="text-[10px] text-indigo-400 font-bold uppercase">Items</div>
                </div>
              </div>
            </div>
            <div className="bg-muted/30 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-medium">Avg. Listing Price</span>
              </div>
              <span className="text-sm font-bold">${(dbMarketplace.reduce((acc, curr) => acc + parseFloat(curr.price || '0'), 0) / dbMarketplace.length || 0).toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Report Management */}
        <div className="bg-white rounded-2xl p-5 border border-border mt-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-500" />
                Active Content Reports
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Review reported items and take action.</p>
            </div>
            <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold">
              {dbReports.filter(r => r.status === 'pending').length} Pending
            </div>
          </div>

          <div className="space-y-4">
            {dbReports.filter(r => r.status === 'pending').length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8 bg-muted/20 rounded-xl border border-dashed border-border">
                No pending reports to review.
              </p>
            ) : (
              dbReports.filter(r => r.status === 'pending').map((report) => (
                <div key={report.id} className="p-4 rounded-xl border border-border bg-white shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                        {report.reported_item_type}
                      </span>
                      <span className="text-xs text-muted-foreground">{report.timestamp}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolveReport(report.id, 'allow')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        ALLOW
                      </button>
                      <button
                        onClick={() => handleResolveReport(report.id, 'delete')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        DELETE
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-foreground">Reason: {report.reason}</div>
                    <p className="text-sm text-muted-foreground italic bg-muted/30 p-2 rounded-lg">"{report.description}"</p>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5" />
                      Reported Item ID: <span className="font-mono bg-muted px-1 rounded">#{report.reported_item_id}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Provider Applications */}
        <div className="bg-white rounded-2xl p-5 border border-border mt-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-500" />
              Service Provider Applications
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Review applications from neighbors who want to offer services.</p>
          </div>
          <div className="space-y-4">
            {providerApps.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">No pending applications.</p>
            ) : (
              providerApps.map(app => (
                <div key={app.id} className="p-4 rounded-xl border border-border bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-foreground">User #{app.user_id}</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold">
                        {app.category}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-indigo-600 mb-1">{app.experience}</div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{app.description}</p>
                  </div>
                  <button
                    onClick={() => handleApproveProvider(app.id)}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm"
                  >
                    APPROVE
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Posts */}
        <div className="bg-white rounded-2xl p-5 border border-border mt-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Latest Community Posts
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Real-time content overview.</p>
          </div>
          <div className="space-y-4">
            {latestPosts.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">No posts found.</p>
            ) : (
              latestPosts.map(post => (
                <div key={post.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/20">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                    P
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="font-semibold text-sm truncate">User #{post.author_id || 'Anon'}</div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {post.moderation_status === 'approved' ? (
                          <span className="text-emerald-600 font-bold">● APPROVED</span>
                        ) : (
                          <span className="text-yellow-600 font-bold">● {post.moderation_status.toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-foreground mb-2 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {dbComments.filter(c => c.post_id === post.id).length} Comments
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" />
                        {post.likes} Likes
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        {post.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Flagged Comments (Real DB) */}
        <div className="bg-white rounded-2xl p-5 border border-border mt-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-500" />
                Flagged Comments (Real-time DB)
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Comments marked as flagged in the database.</p>
            </div>
            <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold">
              {dbComments.filter(c => c.is_flagged).length} Flagged
            </div>
          </div>

          <div className="space-y-4">
            {dbComments.filter(c => c.is_flagged).length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4 bg-muted/10 rounded-xl border border-dashed border-border">
                No flagged comments in the database.
              </p>
            ) : (
              dbComments.filter(c => c.is_flagged).map((comment) => (
                <div key={comment.id} className="flex items-start gap-4 p-4 rounded-xl border border-red-100 bg-red-50/30">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm shrink-0">
                    C
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="font-semibold text-sm truncate">User #{comment.author_id || 'Anon'}</div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">{comment.time}</div>
                    </div>
                    <div className="text-xs text-red-600 font-medium mb-2 bg-red-100 w-fit px-2 py-0.5 rounded">
                      Reason: {comment.flag_reason || 'Inappropriate content'}
                    </div>
                    <p className="text-sm text-foreground mb-2 p-3 bg-white rounded-lg border border-border italic">
                      "{comment.content || 'No content provided'}"
                    </p>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Post ID: <span className="font-mono bg-muted px-1 rounded">#{comment.post_id}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      await dbService.deleteComment(comment.id);
                      const comments = await dbService.getComments();
                      setDbComments(comments);
                    }}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex flex-col items-center gap-1"
                    title="Delete Comment"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="text-[10px] font-bold">DELETE</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Flagged Reviews Moderation */}
        <div className="bg-white rounded-2xl p-5 border border-border mt-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Flagged Reviews
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Review flagged feedback and take disciplinary action.</p>
            </div>
            <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold">
              {dbReviews.filter(r => r.is_flagged && r.moderation_status !== 'approved').length} Pending Moderation
            </div>
          </div>

          <div className="space-y-4">
            {dbReviews.filter(r => r.is_flagged && r.moderation_status !== 'approved').length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8 bg-muted/10 rounded-xl border border-dashed border-border">
                No pending flagged reviews found.
              </p>
            ) : (
              dbReviews.filter(r => r.is_flagged && r.moderation_status !== 'approved').map((review) => (
                <div key={review.id} className="p-4 rounded-xl border border-red-100 bg-red-50/30">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase rounded">
                            Target: {review.target_type}
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {getTargetItemName(review.target_type, review.target_id)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-muted'}`} />
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-border mb-3">
                        <p className="text-sm text-foreground italic">"{review.comment}"</p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Reviewer ID: {review.reviewer_id || 'Guest'}
                        </div>
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertTriangle className="w-3 h-3" />
                          Issue: {review.flag_reason}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 shrink-0">
                      <button 
                        onClick={async () => {
                          await dbService.allowReview(review.id);
                          const reviews = await dbService.getReviews();
                          setDbReviews(reviews);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-xl text-[10px] font-bold hover:bg-green-100 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        ALLOW REVIEW
                      </button>
                      
                      <button 
                        onClick={async () => {
                          if (review.reviewer_id) {
                            const msg = prompt("Enter warning message:", "Last chance! Any further violations will result in immediate removal.");
                            if (msg) {
                              await dbService.notifyReviewer(review.reviewer_id, msg);
                              alert("Warning sent.");
                            }
                          }
                        }}
                        disabled={!review.reviewer_id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-600 border border-yellow-200 rounded-xl text-[10px] font-bold hover:bg-yellow-100 transition-colors disabled:opacity-50"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        SEND WARNING
                      </button>

                      <button 
                        onClick={async () => {
                          if (confirm("Are you sure you want to delete this review and ban the user from the neighborhood?")) {
                            if (review.reviewer_id) {
                              await dbService.deleteReviewAndBan(review.id, review.reviewer_id);
                              const reviews = await dbService.getReviews();
                              setDbReviews(reviews);
                            } else {
                              await dbService.deleteReview(review.id);
                              const reviews = await dbService.getReviews();
                              setDbReviews(reviews);
                            }
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-bold hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        DELETE & BAN
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* User Trust Ranking Table */}
        <div className="bg-white rounded-2xl p-5 border border-border mt-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              User Trust Ranking
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Top users ranked by their overall reputation score.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-3 px-4 font-semibold text-sm text-muted-foreground rounded-tl-xl w-16 text-center">Rank</th>
                  <th className="py-3 px-4 font-semibold text-sm text-muted-foreground">User</th>
                  <th className="py-3 px-4 font-semibold text-sm text-muted-foreground text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-sm text-muted-foreground text-right rounded-tr-xl">Trust Score</th>
                </tr>
              </thead>
              <tbody>
                {rankedUsers.map((u, index) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-muted-foreground">
                      #{index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {u.avatar}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.verified ? (
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
                          Verified
                        </span>
                      ) : (
                        <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center justify-center bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-lg">
                        {u.reputation.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Neighborhood Statistics Table */}
        <div className="bg-white rounded-2xl p-5 border border-border mt-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-500" />
              Neighborhood Stats
            </h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search neighborhoods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-muted/40 border-none rounded-xl text-sm w-full sm:w-64 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-3 px-4 font-semibold text-sm text-muted-foreground rounded-tl-xl">Neighborhood</th>
                  <th className="py-3 px-4 font-semibold text-sm text-muted-foreground text-center">Population</th>
                  <th className="py-3 px-4 font-semibold text-sm text-muted-foreground text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-sm text-muted-foreground text-center">Lead</th>
                  <th className="py-3 px-4 font-semibold text-sm text-muted-foreground text-center">Marketplace</th>
                  <th className="py-3 px-4 font-semibold text-sm text-muted-foreground text-center">Events</th>
                  <th className="py-3 px-4 font-semibold text-sm text-muted-foreground text-center rounded-tr-xl">Services</th>
                </tr>
              </thead>
              <tbody>
                {filteredNeighborhoods.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground font-medium">
                      No neighborhoods found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredNeighborhoods.map((n) => (
                    <tr key={n.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-medium text-foreground">{n.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{n.city}, {n.state}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="bg-blue-50 text-blue-700 py-1 px-3 rounded-lg text-xs font-bold inline-block min-w-[3rem]">
                          {n.population}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {n.verified ? (
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1 w-fit mx-auto">
                            <Shield className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1 w-fit mx-auto">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center text-sm font-medium text-foreground">
                        {n.leadName}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {n.settings?.enableMarketplace ? (
                          <span className="text-emerald-600 font-bold">Yes</span>
                        ) : (
                          <span className="text-muted-foreground font-medium">No</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {n.settings?.enableEvents ? (
                          <span className="text-emerald-600 font-bold">Yes</span>
                        ) : (
                          <span className="text-muted-foreground font-medium">No</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {n.settings?.enableServices ? (
                          <span className="text-emerald-600 font-bold">Yes</span>
                        ) : (
                          <span className="text-muted-foreground font-medium">No</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <BottomNav />
    </div>
  );
}