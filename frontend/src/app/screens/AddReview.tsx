import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Star, ShoppingBag, Briefcase, Calendar, FileText, CheckCircle2 } from "lucide-react";
import {
  authService,
  reviewsService,
  marketplaceService,
  servicesService,
  eventsService,
  postsService,
  neighborhoodsService
} from "../services/storage";
import type { MarketplaceItem, Service, Event, Post } from "../services/types";

type Category = 'marketplace' | 'service' | 'event' | 'post';

export default function AddReview() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>(String(currentUser.neighborhoodId));
  const [category, setCategory] = useState<Category>('marketplace');
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    neighborhoodsService.getEnrolledNeighborhoods(currentUser.id).then(setNeighborhoods).catch(console.error);
  }, [currentUser.id]);

  useEffect(() => {
    fetchItems();
  }, [category, selectedNeighborhood]);

  const fetchItems = async () => {
    setLoading(true);
    setSelectedItem(null);
    try {
      let data: any[] = [];
      const nid = parseInt(selectedNeighborhood);
      switch (category) {
        case 'marketplace':
          data = await marketplaceService.getItems();
          // Filter by neighborhood if the service supports it or if we filter manually
          // Assuming marketplace items have neighborhood_id
          data = data.filter(i => i.neighborhoodId === nid);
          break;
        case 'service':
          data = await servicesService.getServices();
          // Services might be global or specific, but usually neighborhood-linked
          break;
        case 'event':
          data = await eventsService.getEvents(nid);
          break;
        case 'post':
          data = await postsService.getPosts(nid);
          break;
      }
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setSubmitting(true);
    try {
      await reviewsService.addReview({
        targetId: selectedItem.id,
        targetType: category,
        rating,
        comment,
        neighborhoodId: selectedNeighborhood,
      });
      setSuccess(true);
      setTimeout(() => navigate("/reputation"), 2000);
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Submitted!</h2>
        <p className="text-muted-foreground text-center mb-8">Thank you for your feedback. Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">Write a Review</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-border">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Select Community</label>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">Enrolled</span>
            </div>
            <select
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="w-full bg-muted/30 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-primary transition-all cursor-pointer shadow-inner"
            >
              {neighborhoods.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
              {neighborhoods.length === 0 && <option value={currentUser.neighborhoodId}>Default Neighborhood</option>}
            </select>
          </div>

          <div className="mb-8">
            <label className="text-sm font-medium text-gray-700 mb-3 block">What would you like to review?</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'marketplace', label: 'Item', icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
                { id: 'service', label: 'Service', icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-50' },
                { id: 'event', label: 'Event', icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-50' },
                { id: 'post', label: 'Post', icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id as Category)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${category === cat.id
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-muted/30 hover:bg-muted/50'
                    }`}
                >
                  <div className={`p-2 rounded-xl ${cat.bg} ${cat.color}`}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="text-sm font-medium text-gray-700 mb-3 block">Select the specific item</label>
            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : items.length === 0 ? (
              <div className="h-40 flex items-center justify-center border-2 border-dashed border-muted rounded-2xl text-muted-foreground text-sm">
                No items found in this category
              </div>
            ) : (
              <div className="grid gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${selectedItem?.id === item.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-muted-foreground/30'
                      }`}
                  >
                    <div>
                      <div className="font-semibold text-gray-900">{item.title || item.content?.substring(0, 40) + '...'}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {category === 'service' ? item.provider :
                          category === 'marketplace' ? `$${item.price}` :
                            category === 'event' ? item.location : item.category}
                      </div>
                    </div>
                    {selectedItem?.id === item.id && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedItem && (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center p-6 bg-muted/20 rounded-2xl border border-dashed border-border">
                <div className="text-sm font-medium text-gray-600 mb-4 uppercase tracking-widest">Rate your experience</div>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-transform active:scale-90 hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
                          }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-2xl font-bold text-gray-900">
                  {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Tell us more</label>
                <textarea
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What was your experience like? Your feedback helps the community."
                  className="w-full h-32 bg-muted/30 border-none rounded-2xl p-4 text-sm focus:ring-2 ring-primary resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Post Review'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
