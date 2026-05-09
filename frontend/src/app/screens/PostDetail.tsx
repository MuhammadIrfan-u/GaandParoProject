import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Heart, MessageCircle, Share2, Send, Edit2, Trash2, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { postsService, authService } from "../services/storage";
import { Post } from "../services/types";
import { toast } from "sonner";

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    if (!postId) return;
    try {
      const data = await postsService.getPost(postId);
      setPost(data || null);
    } catch (error) {
      toast.error("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!postId) return;
    try {
      await postsService.likePost(postId);
      await loadPost();
    } catch (error) {
      toast.error("Failed to like post");
    }
  };

  const handleComment = async () => {
    if (!postId || !comment.trim()) return;
    try {
      await postsService.addComment(postId, comment);
      setComment("");
      await loadPost();
      toast.success("Comment added!");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleDelete = async () => {
    if (!postId) return;
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await postsService.deletePost(postId);
      toast.success("Post deleted");
      navigate("/home");
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const handleUpdate = async () => {
    if (!postId || !editContent.trim()) return;
    try {
      await postsService.updatePost(postId, editContent, editCategory);
      setIsEditing(false);
      await loadPost();
      toast.success("Post updated!");
    } catch (error) {
      toast.error("Failed to update post");
    }
  };

  const startEditing = () => {
    if (!post) return;
    setEditContent(post.content);
    setEditCategory(post.category);
    setIsEditing(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Post not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Post</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {/* Post */}
        <div className="bg-white border-b border-border">
          <div className="p-4 flex items-start gap-3">
            <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-12 h-12 flex items-center justify-center text-white flex-shrink-0">
              {post.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span>{post.author}</span>
                  {post.verified && (
                    <div className="bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                {post.authorId === currentUser.id && (
                  <div className="flex gap-1">
                    <button onClick={startEditing} className="p-2 hover:bg-muted rounded-full text-muted-foreground">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={handleDelete} className="p-2 hover:bg-muted rounded-full text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground mb-3">{post.time}</div>

              {isEditing ? (
                <div className="space-y-3 mb-4">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleUpdate} size="sm">Save</Button>
                    <Button onClick={() => setIsEditing(false)} variant="ghost" size="sm">Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs mb-3 ${post.categoryColor}`}>
                    {post.category}
                  </span>
                  <p className="text-sm leading-relaxed mb-4">{post.content}</p>
                  {post.image && (
                    <div className="rounded-2xl overflow-hidden border border-border mb-6">
                      <img
                        src={post.image}
                        alt="Post content"
                        className="w-full h-auto object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Actions */}
              <div className="flex justify-right items-center gap-2 pt-2 border-t border-border">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 transition-colors py-2 px-3 rounded-xl ${post.likedBy.includes(currentUser.id)
                    ? 'text-red-500 bg-red-50'
                    : 'text-muted-foreground hover:text-red-500 hover:bg-red-50'
                    }`}
                >
                  <Heart className={`w-5 h-5 ${post.likedBy.includes(currentUser.id) ? 'fill-current' : ''}`} />
                  <span className="text-sm">{post.likes}</span>
                </button>
                <button className="flex items-center gap-2 text-muted-foreground py-2 px-3 rounded-xl">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">{post.comments.length}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="px-4 py-6 border-t border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Comments</h3>
            <span className="bg-muted px-2.5 py-0.5 rounded-full text-xs font-medium text-muted-foreground">
              {post.comments.length}
            </span>
          </div>

          {post.comments.length === 0 ? (
            <div className="text-center py-10 bg-muted/20 rounded-2xl border border-dashed border-border">
              <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {post.comments.map((comment) => (
                <div key={comment.id} className="group">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      {comment.avatar && comment.avatar.length > 2 ? (
                        <img src={comment.avatar} alt={comment.author} className="w-10 h-10 rounded-full object-cover border border-border" />
                      ) : (
                        <div className="bg-gradient-to-br from-primary/80 to-indigo-600 rounded-full w-10 h-10 flex items-center justify-center text-white font-medium text-sm">
                          {comment.avatar}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{comment.author}</span>
                        <span className="text-[10px] text-muted-foreground">{comment.time}</span>
                      </div>
                      <div className="bg-muted/40 rounded-2xl rounded-tl-none p-3 text-sm leading-relaxed text-foreground/90">
                        {comment.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comment Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex gap-3">
          <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-10 h-10 flex items-center justify-center text-white flex-shrink-0">
            {currentUser.avatar}
          </div>
          <div className="flex-1 flex gap-2">
            <Textarea
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none min-h-[40px] max-h-[120px]"
              rows={1}
            />
            <Button
              onClick={handleComment}
              disabled={!comment.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
