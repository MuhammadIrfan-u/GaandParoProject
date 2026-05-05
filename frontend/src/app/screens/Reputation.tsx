import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Star } from "lucide-react";
import type { Review } from "../services/types";
import { authService, reviewsService } from "../services/storage";

export default function Reputation() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [userReviews, setUserReviews] = useState<Review[]>([]);

  useEffect(() => {
    reviewsService.getReviews(currentUser.id).then(setUserReviews).catch(console.error);
  }, [currentUser.id]);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Reputation & Reviews</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-2xl p-6 text-white text-center mb-6">
          <div className="text-5xl mb-2">{currentUser.reputation.toFixed(1)}</div>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-6 h-6 ${
                  star <= Math.round(currentUser.reputation)
                    ? 'fill-yellow-300 text-yellow-300'
                    : 'text-white/40'
                }`}
              />
            ))}
          </div>
          <div className="text-sm opacity-90">{userReviews.length} reviews</div>
        </div>

        <h3 className="text-sm mb-4 px-4 text-muted-foreground">Recent Reviews</h3>

        {userReviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No reviews yet. Stay active in your community to earn reviews!
          </div>
        ) : (
          <div className="space-y-4">
            {userReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl p-4 border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-10 h-10 flex items-center justify-center text-white text-sm">
                    {review.reviewerAvatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span>{review.reviewer}</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'fill-yellow-500 text-yellow-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(review.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}