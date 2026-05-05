import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, DollarSign } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { marketplaceService } from "../services/storage";
import { toast } from "sonner";

export default function CreateMarketplaceItem() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    condition: "used" as 'new' | 'used' | 'like-new',
    category: "Furniture",
  });
  const [loading, setLoading] = useState(false);

  const categories = ["Furniture", "Electronics", "Appliances", "Sports & Outdoors", "Garden", "Kids & Toys", "Books", "Other"];
  const conditions: Array<'new' | 'used' | 'like-new'> = ["new", "used", "like-new"];

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.price) {
      toast.error("Please fill in all fields");
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

      <div className="max-w-lg mx-auto px-4 py-6">
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
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
