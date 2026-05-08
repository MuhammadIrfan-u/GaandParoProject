import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Star, Filter, Plus, ShoppingBag, Briefcase, Calendar, FileText, MoreVertical, Edit2, Trash2, X } from "lucide-react";
import type { Review, Neighborhood } from "../services/types";
import { authService, reviewsService, neighborhoodsService } from "../services/storage";
import { toast } from "sonner";

export default function Reputation() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>(String(currentUser.neighborhoodId));
  
  // Edit State
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");

  const fetchReviews = () => {
    setLoading(true);
    reviewsService.getReviews(selectedNeighborhood, typeFilter)
      .then((data) => {
        setReviews(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    neighborhoodsService.getEnrolledNeighborhoods(currentUser.id).then(setNeighborhoods).catch(console.error);
  }, [currentUser.id]);

  useEffect(() => {
    fetchReviews();
  }, [selectedNeighborhood, typeFilter]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'marketplace': return <ShoppingBag className="w-4 h-4" />;
      case 'service': return <Briefcase className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'post': return <FileText className="w-4 h-4" />;
      default: return null;
    }
  };

  const isRecent = (dateStr?: string) => {
    if (!dateStr) return false;
    const createdTime = new Date(dateStr).getTime();
    const now = new Date().getTime();
    return (now - createdTime) < 24 * 60 * 60 * 1000;
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await reviewsService.deleteReview(id);
      toast.success("Review deleted");
      fetchReviews();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete review");
    }
  };

  const startEdit = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleUpdate = async () => {
    if (!editingReview) return;
    try {
      await reviewsService.updateReview(editingReview.id, {
        rating: editRating,
        comment: editComment
      });
      toast.success("Review updated");
      setEditingReview(null);
      fetchReviews();
    } catch (error: any) {
      toast.error(error.message || "Failed to update review");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold">Community Reviews</h1>
          </div>
          <button 
            onClick={() => navigate("/add-review")}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Add Review</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 border border-border mb-6 shadow-sm">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block px-1">Neighborhood</label>
              <select 
                value={selectedNeighborhood}
                onChange={(e) => setSelectedNeighborhood(e.target.value)}
                className="w-full bg-muted/40 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 ring-primary transition-all cursor-pointer"
              >
                {neighborhoods.map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block px-1">Category</label>
              <div className="flex flex-wrap gap-2">
                {['all', 'marketplace', 'service', 'event', 'post'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-tighter transition-all ${
                      typeFilter === type 
                        ? 'bg-primary text-white shadow-md' 
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted active:scale-95'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-3xl p-6 border border-border shadow-sm text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full transition-all group-hover:w-20 group-hover:h-20" />
            <div className="text-4xl font-black text-primary mb-1">
              {(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1))
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-100'
                  }`}
                />
              ))}
            </div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Community Rating</div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-border shadow-sm text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full transition-all group-hover:w-20 group-hover:h-20" />
            <div className="text-4xl font-black text-indigo-600 mb-1">{reviews.length}</div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-6">Total Reviews</div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-border shadow-sm text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full transition-all group-hover:w-20 group-hover:h-20" />
            <div className="text-4xl font-black text-emerald-600 mb-1">
              {reviews.filter(r => r.rating >= 4).length}
            </div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-6">Positive Vibes</div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">Recent Feedback</h3>
          <div className="text-xs font-medium text-muted-foreground">{reviews.length} reviews</div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-border shadow-sm">
            <div className="bg-muted/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Filter className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">No reviews yet</h4>
            <p className="text-muted-foreground max-w-xs mx-auto">Be the first to share your experience with the community!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-3xl p-6 border border-border shadow-sm hover:shadow-md transition-all group relative">
                <div className="flex items-start gap-5">
                  <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-2xl w-14 h-14 flex items-center justify-center text-white font-bold text-xl shadow-inner flex-shrink-0">
                    {review.reviewerAvatar || review.reviewer?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">{review.reviewer}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] bg-muted/60 px-2.5 py-1 rounded-lg text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1.5">
                            {getTypeIcon(review.targetType)}
                            {review.targetType}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-medium text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                          {new Date(review.timestamp || review.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                        
                        {/* Actions for owner within 24h */}
                        {String(review.reviewerId) === String(currentUser.id) && isRecent(review.timestamp || review.createdAt) && (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => startEdit(review)}
                              className="p-2 hover:bg-primary/10 text-primary rounded-xl transition-colors"
                              title="Edit Review"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(review.id)}
                              className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors"
                              title="Delete Review"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 text-[15px] leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                      {review.comment}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Edit Your Review</h3>
              <button onClick={() => setEditingReview(null)} className="p-2 hover:bg-muted rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-8 text-center">
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Update Rating</div>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setEditRating(star)}
                    className="transition-transform active:scale-90 hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= editRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <label className="text-sm font-bold text-gray-700 mb-3 block px-1">Your Comment</label>
              <textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                className="w-full h-40 bg-muted/30 border-none rounded-2xl p-5 text-[15px] focus:ring-2 ring-primary resize-none placeholder:text-muted-foreground/50 transition-all shadow-inner"
                placeholder="Share your updated thoughts..."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setEditingReview(null)}
                className="flex-1 py-4 px-6 rounded-2xl font-bold text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="flex-2 py-4 px-10 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}