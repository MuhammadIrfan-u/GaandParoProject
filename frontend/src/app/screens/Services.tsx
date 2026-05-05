import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Search, Star, Wrench, Home, Dog, Zap, Scissors, Car, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BottomNav } from "../components/BottomNav";
import { Input } from "../components/ui/input";
import { servicesService, authService } from "../services/storage";
import { Service, User } from "../services/types";
import ProviderDashboard from "./ProviderDashboard";
import { Switch } from "../components/ui/switch";
import { toast } from "sonner";

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isProviderMode, setIsProviderMode] = useState(false);

  useEffect(() => {
    loadServices();
    setUser(authService.getCurrentUser());
  }, [isProviderMode]);

  const loadServices = async () => {
    try {
      const data = await servicesService.getServices();
      setServices(data);
    } catch (error) {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service =>
    (service.status === undefined || service.status === 'active') &&
    (service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
     service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
     service.provider.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: any } = {
      'Plumbing': Wrench,
      'Landscaping': Home,
      'Pet Care': Dog,
      'Electrical': Zap,
      'Cleaning': Scissors,
      'Automotive': Car,
    };
    return icons[category] || Wrench;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Plumbing': 'bg-blue-100 text-blue-700',
      'Landscaping': 'bg-green-100 text-green-700',
      'Pet Care': 'bg-purple-100 text-purple-700',
      'Electrical': 'bg-yellow-100 text-yellow-700',
      'Cleaning': 'bg-pink-100 text-pink-700',
      'Automotive': 'bg-orange-100 text-orange-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-4">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent"
            >
              {isProviderMode ? "Provider Hub" : "Local Services"}
            </motion.h1>
            
            {user?.isProvider && (
              <div className="flex items-center gap-3 bg-white/40 backdrop-blur-sm px-3 py-1.5 rounded-2xl border border-white/20 shadow-sm">
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">
                  {isProviderMode ? "Provider" : "Customer"}
                </span>
                <Switch 
                  checked={isProviderMode} 
                  onCheckedChange={setIsProviderMode}
                  className="scale-90 data-[state=checked]:bg-primary"
                />
              </div>
            )}
          </div>

          {!isProviderMode && (
            <div className="relative group">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/50 border-white/20 focus:ring-primary/20 transition-all duration-300"
                />
              </motion.div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        {isProviderMode ? (
          <ProviderDashboard />
        ) : loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading services...</div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No services found matching your search" : "No services available"}
          </div>
        ) : (
          <motion.div 
            layout
            className="space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredServices.map((service, index) => {
                const Icon = getCategoryIcon(service.category);
                return (
                  <motion.div
                    key={service.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ 
                      duration: 0.3,
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 100
                    }}
                  >
                    <Link
                      to={`/service/${service.id}`}
                      className="block glass-card rounded-3xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 active:scale-95"
                    >
                      <div className="flex gap-4">
                        <div className={`${getCategoryColor(service.category)} rounded-2xl w-20 h-20 flex items-center justify-center flex-shrink-0 shadow-inner`}>
                          <Icon className="w-10 h-10" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="text-lg font-semibold leading-tight">{service.title}</h3>
                            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full">
                              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                              <span className="text-xs font-bold text-yellow-700">{service.rating}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                            {service.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                  {service.providerAvatar}
                                </div>
                                {service.verified && (
                                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                                  </div>
                                )}
                              </div>
                              <span className="text-sm font-medium text-foreground/80">{service.provider}</span>
                            </div>
                            <span className="text-primary font-bold text-base">{service.price}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}