import { useState, useEffect } from "react";
import { TrendingUp, Star, CheckCircle2, MoreVertical, LayoutGrid, List, Trash2, Edit2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { servicesService, authService } from "../services/storage";
import { Service } from "../services/types";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { AddServiceDialog } from "../components/AddServiceDialog";
import { EditServiceDialog } from "../components/EditServiceDialog";
import { toast } from "sonner";

const COLORS = ["#4f46e5", "#e2e8f0"];

export default function ProviderDashboard() {
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    loadMyServices();
  }, []);

  const loadMyServices = async () => {
    try {
      const user = authService.getCurrentUser();
      const allServices = await servicesService.getServices();
      // Filter services provided by the current user
      const filtered = allServices.filter(s => s.provider === user.name);
      setMyServices(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await servicesService.deleteService(serviceId);
      setMyServices(prev => prev.filter(s => s.id !== serviceId));
      toast.success("Service listing deleted");
      setActiveMenuId(null);
    } catch (error) {
      toast.error("Failed to delete service");
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: string | undefined) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await servicesService.updateServiceStatus(id, newStatus);
    setMyServices(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    toast.success(`Service is now ${newStatus}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card rounded-3xl overflow-hidden border-none shadow-xl">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+12%</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Earned</p>
              <h2 className="text-2xl font-black tracking-tight text-foreground truncate">$4,250.00</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-3xl overflow-hidden border-none shadow-xl">
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground">124 Reviews</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Avg Rating</p>
              <div className="flex items-center gap-1.5">
                <h2 className="text-2xl font-black text-foreground">4.8</h2>
                <span className="text-[10px] font-bold text-yellow-600 uppercase">Stars</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-3xl overflow-hidden border-none shadow-xl">
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Active</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Listings</p>
              <div className="flex items-center gap-1.5">
                <h2 className="text-2xl font-black text-foreground">{myServices.length}</h2>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">/ 5 Slots</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Listings List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold">My Active Services</h3>
          <div className="flex gap-2 bg-muted/50 p-1 rounded-xl shadow-inner">
            <Button 
              variant={viewMode === "grid" ? "default" : "ghost"} 
              size="icon" 
              onClick={() => setViewMode("grid")}
              className={`w-8 h-8 rounded-lg transition-all ${viewMode === "grid" ? "shadow-md bg-primary text-white" : "text-muted-foreground"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "default" : "ghost"} 
              size="icon" 
              onClick={() => setViewMode("list")}
              className={`w-8 h-8 rounded-lg transition-all ${viewMode === "list" ? "shadow-md bg-primary text-white" : "text-muted-foreground"}`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className={viewMode === "grid" ? "grid grid-cols-2 gap-4" : "space-y-3"}>
          <AnimatePresence mode="popLayout">
            {myServices.map((service, index) => (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`glass-card rounded-3xl border-none shadow-md hover:shadow-lg transition-all ${viewMode === "grid" ? "h-full" : ""}`}>
                  <CardContent className={`p-4 relative ${viewMode === "list" ? "flex items-center gap-4" : "flex flex-col items-center text-center gap-3"}`}>
                    <div className={`${viewMode === "list" ? "w-12 h-12" : "w-16 h-16"} bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0`}>
                      <CheckCircle2 className={`${viewMode === "list" ? "w-6 h-6" : "w-8 h-8"} text-primary`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{service.title}</h4>
                      <div className={`flex items-center gap-3 mt-1 ${viewMode === "grid" ? "justify-center" : ""}`}>
                        <span className="text-xs font-bold text-primary">{service.price.split('/')[0]}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">25 Bookings</span>
                      </div>
                    </div>

                    <div className={`flex items-center gap-3 ${viewMode === "grid" ? "w-full justify-between mt-2 pt-2 border-t border-border/50" : ""}`}>
                      <div className={`flex items-center gap-2 ${viewMode === "grid" ? "flex-1" : ""}`}>
                        {viewMode === "list" && <span className="text-[9px] font-bold uppercase text-muted-foreground">{service.status || 'active'}</span>}
                        <Switch 
                          checked={(service.status || 'active') === 'active'} 
                          onCheckedChange={() => handleStatusToggle(service.id, service.status || 'active')}
                          className="scale-75 data-[state=checked]:bg-primary"
                        />
                      </div>
                      
                      <div className="relative">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full w-8 h-8 hover:bg-black/5"
                          onClick={() => setActiveMenuId(activeMenuId === service.id ? null : service.id)}
                        >
                          {activeMenuId === service.id ? <X className="w-4 h-4" /> : <MoreVertical className="w-4 h-4" />}
                        </Button>

                        <AnimatePresence>
                          {activeMenuId === service.id && (
                            <>
                              {/* Backdrop for easy closing */}
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setActiveMenuId(null)}
                              />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute right-0 bottom-full mb-2 w-48 bg-white shadow-2xl rounded-2xl border border-border/50 p-2 z-50 overflow-hidden"
                              >
                                <button 
                                  onClick={() => {
                                    setEditingService(service);
                                    setIsEditDialogOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-3 py-3 px-4 hover:bg-muted transition-colors rounded-xl text-left"
                                >
                                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-semibold text-sm">Edit Service</span>
                                </button>
                                <button 
                                  onClick={() => handleDeleteService(service.id)}
                                  className="w-full flex items-center gap-3 py-3 px-4 hover:bg-red-50 text-red-600 transition-colors rounded-xl text-left"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span className="font-semibold text-sm">Delete Listing</span>
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <AddServiceDialog onServiceAdded={loadMyServices} disabled={myServices.length >= 5} />
      
      <EditServiceDialog 
        service={editingService} 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
        onServiceUpdated={loadMyServices} 
      />
    </div>
  );
}
