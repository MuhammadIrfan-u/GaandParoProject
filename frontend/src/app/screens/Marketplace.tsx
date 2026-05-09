import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, Search, Filter, DollarSign, ShoppingBag } from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { marketplaceService, authService } from "../services/storage";
import { MarketplaceItem } from "../services/types";
import { toast } from "sonner";

export default function Marketplace() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      console.log('DEBUG: Marketplace - Current User ID:', currentUser.id);
      
      const data = await marketplaceService.getItems();
      setItems(data);
    } catch (error) {
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-100 text-green-700';
      case 'like-new': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl">Marketplace</h1>
            <Link to="/create-marketplace-item">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-5 h-5 mr-2" />
                List Item
              </Button>
            </Link>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2">
              <Filter className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading items...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No items found matching your search" : "No items listed yet"}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <Link
                key={item.id}
                to={`/marketplace-item/${item.id}`}
                className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-gradient-to-br from-primary/10 to-indigo-100 flex items-center justify-center">
                  <ShoppingBag className="w-12 h-12 text-primary/40" />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getConditionColor(item.condition)}`}>
                      {item.condition === 'like-new' ? 'Like New' : item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                    </span>
                    {item.status === 'sold' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Sold</span>
                    )}
                  </div>
                  <h3 className="text-sm mb-1 line-clamp-1">{item.title}</h3>
                  <div className="flex items-center gap-1 text-primary mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span>{item.price}</span>
                  </div>
                  <div 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/user-profile/${item.sellerId}`);
                    }}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-5 h-5 flex items-center justify-center text-white text-[10px]">
                      {item.sellerAvatar}
                    </div>
                    <span className="line-clamp-1">{item.seller}</span>
                  </div>
                </div>
              </Link>

            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}