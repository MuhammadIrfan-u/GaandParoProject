import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Image as ImageIcon, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { postsService } from "../services/storage";
import { toast } from "sonner";

export default function CreatePost() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const categories = [
    "General",
    "Question",
    "Announcement",
    "Event",
    "Lost & Found",
    "Safety",
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please write something");
      return;
    }

    setLoading(true);
    try {
      await postsService.createPost(content, category, image || undefined);
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
          <h1 className="text-xl font-semibold">Create Post</h1>
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
        <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
          <div className="mb-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
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

          <div className="mb-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">What's on your mind?</label>
            <Textarea
              placeholder="Share with your neighbors..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] resize-none text-lg border-none focus-visible:ring-0 p-0"
              autoFocus
            />
          </div>

          {imagePreview && (
            <div className="relative mb-4 rounded-xl overflow-hidden border border-border">
              <img src={imagePreview} alt="Preview" className="w-full h-auto object-cover max-h-[400px]" />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 hover:bg-muted text-sm font-medium transition-colors"
            >
              <ImageIcon className="w-5 h-5 text-primary" />
              {image ? "Change Photo" : "Add Photo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
