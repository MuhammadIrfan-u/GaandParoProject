import { supabase } from '../supabaseClient.js';
import * as marketplaceItemFraudService from '../services/marketplaceItemFraud.service.js';
import multer from 'multer';

// ─── Multer: in-memory storage, up to 3 images, 5 MB each ───────────────────
const storage = multer.memoryStorage();
export const uploadImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
}).array('images', 3);

// ─── Supabase Storage helpers ────────────────────────────────────────────────
const BUCKET = 'marketplace_items'; // bucket name as given

/**
 * Upload a single buffer to Supabase Storage.
 * Returns the public URL on success, null on failure.
 */
const uploadToStorage = async (buffer, mimetype, itemId, index) => {
  const ext = mimetype.split('/')[1] || 'jpg';
  const path = `${itemId}/${index}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimetype, upsert: true });

  if (error) {
    console.error('Storage upload error:', error);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Delete all images stored under a given item prefix (used on delete/replace).
 */
const deleteStorageImages = async (itemId) => {
  const { data: files, error } = await supabase.storage
    .from(BUCKET)
    .list(`${itemId}`);

  if (error || !files?.length) return;

  const paths = files.map((f) => `${itemId}/${f.name}`);
  await supabase.storage.from(BUCKET).remove(paths);
};

// ─── Transform DB row → API response ────────────────────────────────────────
const transformListing = (data) => ({
  id: data.id.toString(),
  sellerId: data.seller_id?.toString(),
  title: data.title,
  description: data.description,
  price: data.price,
  condition: data.condition,
  category: data.category,
  images: data.images || [],          // array of public URLs
  image: (data.images || [])[0] || null, // backwards-compat: first image
  postedDate: data.posted_date,
  status: data.status,
  isFlagged: data.is_flagged,
  flagReason: data.flag_reason,
  moderationStatus: data.moderation_status,
});

// ─── GET /api/marketplace ────────────────────────────────────────────────────
export const getListings = async (req, res) => {
  try {
    const { search, category, condition, minPrice, maxPrice, status } = req.query;

    let query = supabase
      .from('marketplace_items')
      .select('*')
      .eq('moderation_status', 'approved')
      .order('posted_date', { ascending: false });

    query = query.eq('status', status || 'available');

    if (category) query = query.eq('category', category);
    if (condition) query = query.eq('condition', condition);
    if (minPrice) query = query.gte('price', parseFloat(minPrice));
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice));
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    res.json((data || []).map(transformListing));
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    res.status(500).json({ error: error.message });
  }
};

// ─── GET /api/marketplace/:id ────────────────────────────────────────────────
export const getListingById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Listing not found' });

    res.json(transformListing(data));
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({ error: error.message });
  }
};

// ─── POST /api/marketplace ───────────────────────────────────────────────────
// Accepts multipart/form-data with up to 3 image files via the `images` field.
// Also accepts pre-uploaded URL strings in `imageUrls` (JSON array) for
// clients that handle their own uploads.
export const createListing = async (req, res) => {
  try {
    const { sellerId, title, description, price, condition, category, imageUrls } = req.body;

    if (!sellerId || !title || !description || !price || !condition || !category) {
      return res.status(400).json({
        error: 'Missing required fields: sellerId, title, description, price, condition, category',
      });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: 'Price must be a valid positive number' });
    }

    // ── Insert row first to get the auto-generated ID ──
    const { data: newItem, error: insertError } = await supabase
      .from('marketplace_items')
      .insert([{
        seller_id: parseInt(sellerId),
        title,
        description,
        price: parsedPrice,
        condition,
        category,
        images: [],                       // will be updated after upload
        posted_date: new Date().toISOString(),
        status: 'available',
        is_flagged: false,
        moderation_status: 'approved',
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    // ── Upload files if present ──────────────────────────────────────────────
    let imageArray = [];

    if (req.files?.length) {
      // Enforce max 3 images
      const filesToProcess = req.files.slice(0, 3);
      const uploadResults = await Promise.all(
        filesToProcess.map((file, i) =>
          uploadToStorage(file.buffer, file.mimetype, newItem.id, i)
        )
      );
      imageArray = uploadResults.filter(Boolean);
    } else if (imageUrls) {
      // Client passed pre-resolved URLs (e.g. uploaded via frontend SDK)
      try {
        const parsed = JSON.parse(imageUrls);
        imageArray = Array.isArray(parsed) ? parsed.slice(0, 3) : [];
      } catch {
        // ignore malformed JSON
      }
    }

    // ── Update row with resolved image URLs ──────────────────────────────────
    const { data, error: updateError } = await supabase
      .from('marketplace_items')
      .update({ images: imageArray })
      .eq('id', newItem.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // ── Background fraud check ───────────────────────────────────────────────
    marketplaceItemFraudService.check({
      id: data.id,
      title: data.title,
      description: data.description,
      price: data.price,
      category: data.category,
    }).catch((err) => console.error('Marketplace fraud check error:', err));

    res.status(201).json(transformListing(data));
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ error: error.message });
  }
};

// ─── PUT /api/marketplace/:id ────────────────────────────────────────────────
// Accepts new image files OR imageUrls (JSON array) OR neither (keep existing).
// Pass `replaceImages=true` in the body to clear old storage files first.
export const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { sellerId, title, description, price, condition, category, status, imageUrls, replaceImages } = req.body;

    // Verify ownership
    const { data: item, error: fetchError } = await supabase
      .from('marketplace_items')
      .select('seller_id, images')
      .eq('id', id)
      .single();

    if (fetchError || !item) return res.status(404).json({ error: 'Listing not found' });
    if (parseInt(item.seller_id) !== parseInt(sellerId)) {
      return res.status(403).json({ error: 'Unauthorized: Only the seller can update this listing' });
    }

    // ── Resolve new images ───────────────────────────────────────────────────
    let imageArray = item.images || []; // default: keep existing

    if (req.files?.length) {
      if (replaceImages === 'true' || replaceImages === true) {
        await deleteStorageImages(id);
        imageArray = [];
      }
      const filesToProcess = req.files.slice(0, 3);
      const uploadResults = await Promise.all(
        filesToProcess.map((file, i) =>
          uploadToStorage(file.buffer, file.mimetype, id, i)
        )
      );
      imageArray = [...imageArray, ...uploadResults.filter(Boolean)].slice(0, 3);
    } else if (imageUrls !== undefined) {
      try {
        const parsed = JSON.parse(imageUrls);
        imageArray = Array.isArray(parsed) ? parsed.slice(0, 3) : imageArray;
      } catch {
        // ignore malformed JSON
      }
    }

    // ── Build update payload (only include defined fields) ───────────────────
    const updatePayload = { images: imageArray };
    if (title !== undefined) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (price !== undefined) updatePayload.price = parseFloat(price);
    if (condition !== undefined) updatePayload.condition = condition;
    if (category !== undefined) updatePayload.category = category;
    if (status !== undefined) updatePayload.status = status;

    const { data, error } = await supabase
      .from('marketplace_items')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(transformListing(data));
  } catch (error) {
    console.error('Error updating listing:', error);
    res.status(500).json({ error: error.message });
  }
};

// ─── DELETE /api/marketplace/:id ─────────────────────────────────────────────
export const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { sellerId } = req.query;

    const { data: item, error: fetchError } = await supabase
      .from('marketplace_items')
      .select('seller_id')
      .eq('id', id)
      .single();

    if (fetchError || !item) return res.status(404).json({ error: 'Listing not found' });
    if (parseInt(item.seller_id) !== parseInt(sellerId)) {
      return res.status(403).json({ error: 'Unauthorized: Only the seller can delete this listing' });
    }

    // Delete storage images first
    await deleteStorageImages(id);

    const { error } = await supabase.from('marketplace_items').delete().eq('id', id);
    if (error) throw error;

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ error: error.message });
  }
};