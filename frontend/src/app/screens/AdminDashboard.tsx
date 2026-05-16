import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, Shield, Users, AlertTriangle, Calendar,
  Trash2, Edit, BarChart3, Activity, Store, Settings, Flag, FileText, CheckCircle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { ProviderApplicationReviewCard, type ProviderApplicationRow } from "../components/ProviderApplicationReviewCard";
import { toast } from "sonner";
import {
  authService,
  neighborhoodsService,
  postsService,
  eventsService,
  marketplaceService,
  servicesService,
  usersService
} from "../services/storage";
import { adminService } from "../services/adminservice";
import { supabase } from "../services/supabaseClient";
import type {
  Post, Event, MarketplaceItem, Alert, User, Neighborhood
} from "../services/types";

type Tab = 'analytics' | 'settings' | 'users' | 'posts' | 'events' | 'marketplace' | 'alerts' | 'applications' | 'reports' | 'documents';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { neighborhoodId } = useParams();
  const currentUser = authService.getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);

  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [marketItems, setMarketItems] = useState<MarketplaceItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [applications, setApplications] = useState<ProviderApplicationRow[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<any>({});

  // Editing States
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [editingMarket, setEditingMarket] = useState<MarketplaceItem | null>(null);

  useEffect(() => {
    const checkAccessAndLoadData = async () => {
      setLoading(true);
      try {
        let isSuperadmin = false;
        try {
          const { data } = await supabase
            .from('Superadmin')
            .select('id')
            .eq('user_id', currentUser?.id)
            .maybeSingle();
          if (data) isSuperadmin = true;
        } catch (err) {
          console.error('Error checking superadmin status:', err);
        }

        let nId = neighborhoodId;
        let nData = null;

        if (nId) {
          if (!currentUser?.isAdmin && !isSuperadmin) {
            toast.error("Only Super Admins can manage arbitrary neighborhoods.");
            navigate("/home");
            return;
          }
          const allNeighborhoods = await neighborhoodsService.getNeighborhoods();
          nData = allNeighborhoods.find(n => String(n.id) === String(nId));
        } else {
          if (!currentUser?.neighborhoodId) {
            toast.error("You are not assigned to a neighborhood.");
            navigate("/home");
            return;
          }
          const allNeighborhoods = await neighborhoodsService.getNeighborhoods();
          nData = allNeighborhoods.find(n => String(n.id) === String(currentUser.neighborhoodId));
          const isNeighborhoodAdmin = nData?.adminId && String(nData.adminId) === String(currentUser?.id);

          if (!currentUser?.isAdmin && !isNeighborhoodAdmin && !isSuperadmin) {
            toast.error("Access denied. Neighborhood Admins only.");
            navigate("/home");
            return;
          }
          nId = nData?.id as any;
        }

        setNeighborhood(nData || null);

        if (nId) {
          const data = await adminService.getDashboardData(nId);
          setStats(data.stats);
          setUsers(data.users);
          setPosts(data.posts);
          setEvents(data.events);
          setMarketItems(data.marketplaceItems);
          setAlerts(data.alerts);
          setApplications(data.applications);
          setReports(data.reports || []);
          setSettings(data.settings || {
            enable_marketplace: true,
            enable_public_alerts: true,
            enable_events: true,
            enable_services: true,
            require_verification: false
          });
          // load documents lightly if provided in dashboard payload
          if (data.documents) setDocuments(data.documents);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    checkAccessAndLoadData();
  }, [navigate, currentUser, neighborhoodId]);

  const handleDelete = async (type: string, id: string) => {
    try {
      if (type === 'post') { await adminService.deletePost(id); setPosts(posts.filter(p => p.id !== id)); }
      if (type === 'event') { await adminService.deleteEvent(id); setEvents(events.filter(e => e.id !== id)); }
      if (type === 'alert') { await adminService.deleteAlert(id); setAlerts(alerts.filter(a => a.id !== id)); }
      if (type === 'market') { await adminService.deleteMarketItem(id); setMarketItems(marketItems.filter(i => i.id !== id)); }
      toast.success("Item deleted successfully");
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const handleAppStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await adminService.updateApplicationStatus(id, status);
      setApplications(applications.map(a => String(a.id) === id ? { ...a, status } : a));
      toast.success(`Application ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const saveSettings = async () => {
    if (!neighborhood?.id) return;
    try {
      await adminService.updateSettings(neighborhood.id, settings);
      toast.success("Settings updated");
    } catch {
      toast.error("Failed to update settings");
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'Hub Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'posts', label: 'Posts', icon: <Activity className="w-4 h-4" /> },
    { id: 'events', label: 'Events', icon: <Calendar className="w-4 h-4" /> },
    { id: 'marketplace', label: 'Market', icon: <Store className="w-4 h-4" /> },
    { id: 'alerts', label: 'Alerts', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'applications', label: 'Providers', icon: <Shield className="w-4 h-4" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <Flag className="w-4 h-4" /> },
  ];

  // Load documents when documents tab is active
  useEffect(() => {
    const loadDocuments = async () => {
      if (activeTab !== 'documents' || !neighborhood?.id) return;
      try {
        const docs = await adminService.getDocuments(neighborhood.id);
        setDocuments(Array.isArray(docs) ? docs : []);
      } catch (err) {
        console.error('Failed to load documents:', err);
        toast.error('Failed to load documents');
      }
    };
    loadDocuments();
  }, [activeTab, neighborhood]);

  const filterFlagged = (items: any[]) => showFlaggedOnly ? items.filter(i => i.is_flagged || i.isFlagged) : items;

  // Edit Handlers
  const handleSavePost = async () => {
    if (!editingPost) return;
    try {
      await adminService.editPost(editingPost.id, editingPost.content);
      setPosts(posts.map(p => p.id === editingPost.id ? editingPost : p));
      setEditingPost(null);
      toast.success("Post updated");
    } catch { toast.error("Update failed"); }
  };

  const handleSaveEvent = async () => {
    if (!editingEvent) return;
    try {
      await adminService.editEvent(editingEvent.id, {
        title: editingEvent.title, description: editingEvent.description,
        date: editingEvent.date, time: editingEvent.time
      });
      setEvents(events.map(e => e.id === editingEvent.id ? editingEvent : e));
      setEditingEvent(null);
      toast.success("Event updated");
    } catch { toast.error("Update failed"); }
  };

  const handleSaveAlert = async () => {
    if (!editingAlert) return;
    try {
      await adminService.editAlert(editingAlert.id, {
        title: editingAlert.title, description: editingAlert.description, severity: editingAlert.severity
      });
      setAlerts(alerts.map(a => a.id === editingAlert.id ? editingAlert : a));
      setEditingAlert(null);
      toast.success("Alert updated");
    } catch { toast.error("Update failed"); }
  };

  const handleSaveMarket = async () => {
    if (!editingMarket) return;
    try {
      await adminService.editMarketItem(editingMarket.id, {
        title: editingMarket.title, description: editingMarket.description, price: editingMarket.price
      });
      setMarketItems(marketItems.map(m => m.id === editingMarket.id ? editingMarket : m));
      setEditingMarket(null);
      toast.success("Market item updated");
    } catch { toast.error("Update failed"); }
  };

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  <h1 className="text-2xl font-bold">Neighborhood Admin Dashboard</h1>
                </div>
                <p className="text-sm opacity-90">{neighborhood?.name || 'Loading...'}</p>
              </div>
            </div>

            <Button
              variant="outline"
              className={`border-white/30 ${showFlaggedOnly ? 'bg-red-500/20 text-red-50' : 'bg-transparent text-white hover:bg-white/10'}`}
              onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {showFlaggedOnly ? 'Show Flagged' : 'Hide Flagged'}
            </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-4 rounded-xl transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-lg font-medium' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
              >
                {tab.icon}
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center py-20"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
        ) : (
          <div className="space-y-6">

            {activeTab === 'analytics' && stats && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border shadow-sm"><Users className="w-8 h-8 text-blue-500 mb-2" /><div className="text-3xl font-bold">{stats.users}</div><div className="text-sm text-muted-foreground">Total Users</div></div>
                <div className="bg-white p-6 rounded-2xl border shadow-sm"><Activity className="w-8 h-8 text-green-500 mb-2" /><div className="text-3xl font-bold">{stats.posts}</div><div className="text-sm text-muted-foreground">Posts</div></div>
                <div className="bg-white p-6 rounded-2xl border shadow-sm"><Calendar className="w-8 h-8 text-purple-500 mb-2" /><div className="text-3xl font-bold">{stats.events}</div><div className="text-sm text-muted-foreground">Events</div></div>
                <div className="bg-white p-6 rounded-2xl border shadow-sm"><Store className="w-8 h-8 text-orange-500 mb-2" /><div className="text-3xl font-bold">{stats.marketplaceItems}</div><div className="text-sm text-muted-foreground">Market Items</div></div>
                <div className="bg-white p-6 rounded-2xl border shadow-sm"><AlertTriangle className="w-8 h-8 text-red-500 mb-2" /><div className="text-3xl font-bold">{stats.alerts}</div><div className="text-sm text-muted-foreground">Alerts</div></div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white p-6 rounded-2xl border shadow-sm max-w-2xl mx-auto space-y-6">
                <h2 className="text-xl font-bold border-b pb-2">Hub Settings</h2>
                {Object.keys(settings).filter(k => k.startsWith('enable_') || k.startsWith('require_')).map(key => (
                  <div key={key} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg">
                    <span className="capitalize text-gray-700 font-medium">{key.replace(/_/g, ' ')}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings[key]} onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={saveSettings}>Save Settings</Button>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-white rounded-2xl border divide-y shadow-sm">
                {users.map(user => (
                  <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">{user.name.charAt(0)}</div>
                      <div>
                        <div className="font-medium flex items-center gap-2">{user.name} {user.verified && <Shield className="w-3 h-3 text-blue-500" />}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'posts' && (
              <div className="space-y-4">
                {filterFlagged(posts).map(post => (
                  <div key={post.id} className="bg-white p-5 rounded-2xl border shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium">{post.author}</div>
                      <div className="text-xs text-muted-foreground">{new Date(post.time).toLocaleDateString()}</div>
                    </div>
                    <p className="text-gray-800 mb-4">{post.content}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingPost(post)}><Edit className="w-4 h-4 mr-2" /> Edit</Button>
                      <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete('post', post.id)}><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4">
                {documents.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border shadow-sm">No documents found.</div>
                ) : (
                  documents.map(doc => (
                    <div key={doc.id} className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-14 bg-muted/30 rounded overflow-hidden flex items-center justify-center">
                          <img src={doc.documentUrl} alt="doc" className="object-cover w-full h-full" />
                        </div>
                        <div>
                          <div className="font-medium">{doc.userName || doc.userId}</div>
                          <div className="text-sm text-muted-foreground">Submitted: {new Date(doc.submittedAt).toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">Neighborhood: {doc.neighborhoodName || doc.neighborhoodId}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!!actionLoading[doc.id]}
                          onClick={async () => {
                            setActionLoading(s => ({ ...s, [doc.id]: true }));
                            try {
                              await adminService.updateDocumentStatus(neighborhood?.id || '', doc.id, 'approved', 'Approved via dashboard');
                              toast.success('Document approved');
                              // remove approved document from the list
                              setDocuments(docs => docs.filter(d => d.id !== doc.id));
                            } catch (err) {
                              console.error(err);
                              toast.error('Failed to approve');
                            } finally {
                              setActionLoading(s => ({ ...s, [doc.id]: false }));
                            }
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />Approve
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          disabled={!!actionLoading[doc.id]}
                          onClick={async () => {
                            setActionLoading(s => ({ ...s, [doc.id]: true }));
                            try {
                              await adminService.updateDocumentStatus(neighborhood?.id || '', doc.id, 'rejected', 'Rejected via dashboard');
                              toast.success('Document rejected');
                              // remove rejected document from the list
                              setDocuments(docs => docs.filter(d => d.id !== doc.id));
                            } catch (err) {
                              console.error(err);
                              toast.error('Failed to reject');
                            } finally {
                              setActionLoading(s => ({ ...s, [doc.id]: false }));
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />Reject
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'events' && (
              <div className="space-y-4">
                {filterFlagged(events).map(event => (
                  <div key={event.id} className="bg-white p-5 rounded-2xl border shadow-sm flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">{event.date} at {event.time}</p>
                      <p className="text-sm text-gray-600">{event.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => setEditingEvent(event)}><Edit className="w-5 h-5" /></Button>
                      <Button variant="outline" size="icon" className="text-red-600" onClick={() => handleDelete('event', event.id)}><Trash2 className="w-5 h-5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'marketplace' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filterFlagged(marketItems).map(item => (
                  <div key={item.id} className="bg-white p-5 rounded-2xl border shadow-sm flex justify-between">
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-lg font-bold text-blue-600">${item.price}</p>
                      <p className="text-xs text-muted-foreground">By {item.seller}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => setEditingMarket(item)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="outline" size="icon" className="text-red-600" onClick={() => handleDelete('market', item.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="space-y-4">
                {filterFlagged(alerts).map(alert => (
                  <div key={alert.id} className={`p-5 rounded-2xl border shadow-sm ${alert.severity === 'critical' ? 'bg-red-50' : 'bg-white'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-500" /><h3 className="font-bold">{alert.title}</h3></div>
                    </div>
                    <p className="text-sm mb-4">{alert.description}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingAlert(alert)}><Edit className="w-4 h-4 mr-2" /> Edit</Button>
                      <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete('alert', alert.id)}><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="space-y-4">
                {applications.map(app => (
                  <ProviderApplicationReviewCard
                    key={String(app.id)}
                    app={app}
                    onApprove={(applicationId) => handleAppStatus(applicationId, 'approved')}
                    onReject={(applicationId) => handleAppStatus(applicationId, 'rejected')}
                  />
                ))}
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-6">
                {reports.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border shadow-sm">
                    <Flag className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-muted-foreground">No reports found for this neighborhood.</p>
                  </div>
                ) : (
                  reports.map(report => (
                    <ReportItemCard key={report.id} report={report} onUpdate={() => {/* refresh data */ }} />
                  ))
                )}
              </div>
            )}

          </div>
        )}
      </div>

      {/* Editing Modals */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit Post</h3>
            <textarea className="w-full border rounded p-3 mb-4 h-32" value={editingPost.content} onChange={e => setEditingPost({ ...editingPost, content: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingPost(null)}>Cancel</Button>
              <Button className="bg-blue-600" onClick={handleSavePost}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {editingEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h3 className="text-xl font-bold mb-2">Edit Event</h3>
            <input className="w-full border rounded p-2" value={editingEvent.title} onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })} placeholder="Title" />
            <textarea className="w-full border rounded p-2 h-24" value={editingEvent.description} onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })} placeholder="Description" />
            <input type="date" className="w-full border rounded p-2" value={editingEvent.date} onChange={e => setEditingEvent({ ...editingEvent, date: e.target.value })} />
            <input type="time" className="w-full border rounded p-2" value={editingEvent.time} onChange={e => setEditingEvent({ ...editingEvent, time: e.target.value })} />
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setEditingEvent(null)}>Cancel</Button>
              <Button className="bg-blue-600" onClick={handleSaveEvent}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {editingAlert && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h3 className="text-xl font-bold mb-2">Edit Alert</h3>
            <input className="w-full border rounded p-2" value={editingAlert.title} onChange={e => setEditingAlert({ ...editingAlert, title: e.target.value })} placeholder="Title" />
            <textarea className="w-full border rounded p-2 h-24" value={editingAlert.description} onChange={e => setEditingAlert({ ...editingAlert, description: e.target.value })} placeholder="Description" />
            <select className="w-full border rounded p-2" value={editingAlert.severity} onChange={e => setEditingAlert({ ...editingAlert, severity: e.target.value as any })}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
            </select>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setEditingAlert(null)}>Cancel</Button>
              <Button className="bg-blue-600" onClick={handleSaveAlert}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {editingMarket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h3 className="text-xl font-bold mb-2">Edit Market Item</h3>
            <input className="w-full border rounded p-2" value={editingMarket.title} onChange={e => setEditingMarket({ ...editingMarket, title: e.target.value })} placeholder="Title" />
            <textarea className="w-full border rounded p-2 h-24" value={editingMarket.description} onChange={e => setEditingMarket({ ...editingMarket, description: e.target.value })} placeholder="Description" />
            <input type="number" className="w-full border rounded p-2" value={editingMarket.price} onChange={e => setEditingMarket({ ...editingMarket, price: parseFloat(e.target.value) })} placeholder="Price" />
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setEditingMarket(null)}>Cancel</Button>
              <Button className="bg-blue-600" onClick={handleSaveMarket}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportItemCard({ report, onUpdate }: { report: any, onUpdate: () => void }) {
  const navigate = useNavigate();

  const handleViewContent = () => {
    const itemId = report.reported_item_id || report.reportedItemId;
    const type = (report.reported_item_type || report.reportedItemType || '').toLowerCase();

    if (!itemId) {
      toast.error("Item ID not found for this report");
      return;
    }

    switch (type) {
      case 'post': navigate(`/post/${itemId}`); break;
      case 'event': navigate(`/event/${itemId}`); break;
      case 'marketplace': navigate(`/marketplace-item/${itemId}`); break;
      case 'service': navigate(`/service/${itemId}`); break;
      case 'user': navigate(`/user-profile/${itemId}`); break;
      case 'message': navigate(`/messages`); break;
      default: toast.error(`Unknown report type: ${type}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-xl">
              <Flag className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg capitalize">{report.reported_item_type} Reported</h3>
              <p className="text-xs text-muted-foreground">
                Reported by <span className="font-medium text-foreground">{report.reporter?.name || 'Unknown'}</span> • {new Date(report.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${report.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
            }`}>
            {report.status.toUpperCase()}
          </div>
        </div>

        <div className="bg-muted/30 rounded-2xl p-4 mb-4">
          <div className="text-sm font-bold mb-1 text-red-900">Reason: {report.reason}</div>
          <p className="text-sm text-gray-700 leading-relaxed">{report.description}</p>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 rounded-xl"
            onClick={handleViewContent}
          >
            View Content
          </Button>
          <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl ml-auto text-muted-foreground hover:text-green-600">
            Mark Resolved
          </Button>
        </div>
      </div>
    </div>
  );
}
