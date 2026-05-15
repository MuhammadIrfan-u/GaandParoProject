import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, DollarSign, ImagePlus, X, Image as ImageIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { marketplaceService } from "../services/storage";
import { toast } from "sonner";

const MAX_IMAGES = 3;

export default function CreateMarketplaceItem() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    condition: "used" as 'new' | 'used' | 'like-new',
    category: "Furniture",
  });

  // Each entry: { file: File; preview: string }
  const [imageFiles, setImageFiles] = useState<{ file: File; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const categories = ["Furniture", "Electronics", "Appliances", "Sports & Outdoors", "Garden", "Kids & Toys", "Books", "Other"];
  const conditions: Array<'new' | 'used' | 'like-new'> = ["new", "used", "like-new"];

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - imageFiles.length;
    if (remaining <= 0) {
      toast.error(`You can upload a maximum of ${MAX_IMAGES} images`);
      return;
    }

    const toAdd = files.slice(0, remaining);
    const newEntries = toAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImageFiles((prev) => [...prev, ...newEntries]);
    // Reset so the same file can be re-picked if removed
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await marketplaceService.createItem({
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        condition: formData.condition,
        category: formData.category,
        imageFiles: imageFiles.map((e) => e.file),
      });
      toast.success("Item listed successfully!");
      navigate("/marketplace");
    } catch (error) {
      toast.error("Failed to create listing");
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
          <h1 className="text-xl">List Item</h1>
          <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* ── Image Upload ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 border border-border">
          <label className="block text-sm mb-3">
            Photos
            <span className="ml-1 text-muted-foreground">({imageFiles.length}/{MAX_IMAGES})</span>
          </label>

          <div className="flex gap-3 flex-wrap">
            {/* Existing previews */}
            {imageFiles.map((entry, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border flex-shrink-0">
                <img src={entry.preview} alt={`preview ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-black/50 text-white py-0.5">
                    Cover
                  </span>
                )}
              </div>
            ))}

            {/* Add button — only show when under the limit */}
            {imageFiles.length < MAX_IMAGES && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
              >
                <ImagePlus className="w-6 h-6" />
                <span className="text-xs">Add Photo</span>
              </button>
            )}

            {/* Empty state hint when no images yet */}
            {imageFiles.length === 0 && (
              <div className="flex-1 flex items-center gap-2 text-xs text-muted-foreground pl-1">
                <ImageIcon className="w-4 h-4 flex-shrink-0" />
                First photo will be the cover image
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImagePick}
          />
        </div>

        {/* ── Item Details ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 border border-border space-y-4">
          <div>
            <label className="block text-sm mb-2">Title</label>
            <Input
              placeholder="e.g., Vintage Bookshelf"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Description</label>
            <Textarea
              placeholder="Describe your item..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="min-h-[120px]"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Price ($)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="number"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Category</label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm mb-2">Condition</label>
            <Select value={formData.condition} onValueChange={(value: 'new' | 'used' | 'like-new') => setFormData({ ...formData, condition: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {conditions.map((cond) => (
                  <SelectItem key={cond} value={cond}>
                    {cond === 'like-new' ? 'Like New' : cond.charAt(0).toUpperCase() + cond.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}