import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, DollarSign, MapPin, ShoppingBag, MessageCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { marketplaceService } from "../services/storage";
import { MarketplaceItem } from "../services/types";
import { toast } from "sonner";

export default function MarketplaceItemDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItem();
  }, [itemId]);

  const loadItem = async () => {
    if (!itemId) return;
    try {
      const data = await marketplaceService.getItem(itemId);
      setItem(data || null);
    } catch (error) {
      toast.error("Failed to load item");
    } finally {
      setLoading(false);
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-100 text-green-700';
      case 'like-new': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Item not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Marketplace</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="aspect-square bg-gradient-to-br from-primary/10 to-indigo-100 flex items-center justify-center">
          <ShoppingBag className="w-24 h-24 text-primary/40" />
        </div>

        <div className="px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-sm px-3 py-1 rounded-full ${getConditionColor(item.condition)}`}>
              {item.condition === 'like-new' ? 'Like New' : item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
            </span>
            <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">{item.category}</span>
            {item.status === 'sold' && (
              <span className="text-sm px-3 py-1 rounded-full bg-red-100 text-red-700">Sold</span>
            )}
          </div>

          <h1 className="text-2xl mb-2">{item.title}</h1>
          
          <div className="flex items-center gap-2 text-3xl text-primary mb-4">
            <DollarSign className="w-8 h-8" />
            <span>{item.price}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-border mb-4">
            <h3 className="text-sm mb-3">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-border mb-4">
            <h3 className="text-sm mb-3">Seller</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-12 h-12 flex items-center justify-center text-white">
                  {item.sellerAvatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span>{item.seller}</span>
                    {item.verified && (
                      <div className="bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Posted {item.postedDate}</div>
                </div>
              </div>
              <Link to="/messages" className="text-primary">
                <MessageCircle className="w-6 h-6" />
              </Link>
            </div>
          </div>

          <div className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Oak Valley Community
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4">
        <div className="max-w-lg mx-auto grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => toast.success("Added to saved items!")}
            className="w-full"
          >
            Save
          </Button>
          <Link to="/messages" className="w-full">
            <Button className="w-full bg-primary hover:bg-primary/90">
              <MessageCircle className="w-5 h-5 mr-2" />
              Message Seller
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
