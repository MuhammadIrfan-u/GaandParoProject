import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { postsService } from "../services/storage";
import { toast } from "sonner";

export default function CreatePost() {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [loading, setLoading] = useState(false);

  const categories = [
    "General",
    "Question",
    "Announcement",
    "Event",
    "Lost & Found",
    "Safety",
  ];

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please write something");
      return;
    }

    setLoading(true);
    try {
      await postsService.createPost(content, category);
      toast.success("Post created successfully!");
      navigate("/home");
    } catch (error) {
      toast.error("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Create Post</h1>
          <Button
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-4 border border-border">
          <div className="mb-4">
            <label className="block text-sm mb-2">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-2">What's on your mind?</label>
            <Textarea
              placeholder="Share with your neighbors..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] resize-none"
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 hover:bg-muted text-sm">
              <ImageIcon className="w-5 h-5" />
              Add Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
