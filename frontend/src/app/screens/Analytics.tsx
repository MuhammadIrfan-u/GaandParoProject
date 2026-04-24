import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, Users, TrendingUp, Calendar, ShoppingBag, AlertTriangle } from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import type { AnalyticsData } from "../services/types";
import { analyticsService } from "../services/storage";

export default function Analytics() {
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    analyticsService.getAnalytics().then(setAnalyticsData).catch(console.error);
  }, []);

  const stats = [
    { icon: Users, label: "Total Users", value: "248", color: "bg-blue-500", change: "+12%" },
    { icon: TrendingUp, label: "Posts This Month", value: "456", color: "bg-green-500", change: "+8%" },
    { icon: Calendar, label: "Events", value: "23", color: "bg-purple-500", change: "+4" },
    { icon: ShoppingBag, label: "Marketplace", value: "67", color: "bg-orange-500", change: "+15" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Community Analytics</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 border border-border">
              <div className={`${stat.color} rounded-xl w-12 h-12 flex items-center justify-center text-white mb-3`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-2xl mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground mb-1">{stat.label}</div>
              <div className="text-xs text-green-600">{stat.change}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-4 border border-border mb-6">
          <h3 className="text-lg mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analyticsData?.userGrowth ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-border mb-6">
          <h3 className="text-lg mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analyticsData?.engagement ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar key="posts" dataKey="posts" fill="#6366f1" />
              <Bar key="events" dataKey="events" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-border">
            <h3 className="text-lg mb-4">Top Categories</h3>
            <div className="space-y-3">
              {(analyticsData?.topCategories ?? []).map((category) => (
                <div key={category.category}>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span>{category.category}</span>
                    <span className="text-muted-foreground">{category.count}</span>
                  </div>
                  <div className="bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2"
                      style={{ width: `${(category.count / 145) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-border">
            <h3 className="text-lg mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Posts</span>
                <span className="text-lg">{analyticsData?.activityStats.totalPosts ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Events</span>
                <span className="text-lg">{analyticsData?.activityStats.totalEvents ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Marketplace Items</span>
                <span className="text-lg">{analyticsData?.activityStats.totalMarketplace ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Services Listed</span>
                <span className="text-lg">{analyticsData?.activityStats.totalServices ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}