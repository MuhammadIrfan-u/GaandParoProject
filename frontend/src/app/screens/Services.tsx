import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Search, Star, Wrench, Home, Dog, Zap, Scissors, Car } from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { Input } from "../components/ui/input";
import { servicesService } from "../services/storage";
import { Service } from "../services/types";
import { toast } from "sonner";

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

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
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.provider.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl mb-4">Local Services</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading services...</div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No services found matching your search" : "No services available"}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredServices.map((service) => {
              const Icon = getCategoryIcon(service.category);
              return (
                <Link
                  key={service.id}
                  to={`/service/${service.id}`}
                  className="block bg-white rounded-2xl border border-border p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex gap-4">
                    <div className={`${getCategoryColor(service.category)} rounded-2xl w-16 h-16 flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg mb-1">{service.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{service.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm mb-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span>{service.rating}</span>
                          <span className="text-muted-foreground">({service.reviewCount})</span>
                        </div>
                        <span className="text-primary">{service.price}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs">
                          {service.providerAvatar}
                        </div>
                        <div className="text-sm">
                          <span>{service.provider}</span>
                          {service.verified && (
                            <span className="ml-1 text-blue-500">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}