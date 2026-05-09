import { supabase } from '../supabaseClient.js';
import * as postFraudService from '../services/postFraud.service.js';
import * as commentFraudService from '../services/commentFraud.service.js';

const transformPost = (data) => ({
    id: data.id.toString(),
    authorId: data.author_id?.toString(),
    author: data.users?.name || 'Unknown User',
    avatar: data.users?.avatar || (data.users?.name ? data.users.name.charAt(0) : 'U'),
    verified: data.users?.verified || false,
    content: data.content,
    image: data.image,
    likes: data.likes || 0,
    category: data.category,
    time: data.created_at ? new Date(data.created_at).toLocaleString() : 'Just now',
    likedBy: data.post_likes?.map(l => l.user_id.toString()) || [],
    comments: data.comments?.filter(c => c.moderation_status === 'approved').map(c => ({
        id: c.id.toString(),
        authorId: c.author_id?.toString(),
        author: c.users?.name || 'Unknown User',
        avatar: c.users?.avatar || (c.users?.name ? c.users.name.charAt(0) : 'U'),
        content: c.content,
        time: new Date(c.time).toLocaleString()
    })) || [],
});

export const getPosts = async (req, res) => {
    try {
        const { neighborhoodId } = req.query;

        if (!neighborhoodId) {
            return res.status(400).json({ error: 'neighborhoodId is required' });
        }

        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                users (
                    name,
                    avatar,
                    verified
                ),
                post_likes (
                    user_id
                ),
                comments (
                    id,
                    author_id,
                    content,
                    time,
                    moderation_status,
                    users (
                        name,
                        avatar
                    )
                )
            `)
            .eq('neighborhod_id', parseInt(neighborhoodId))
            .eq('moderation_status', 'approved')
            .order('id', { ascending: false });

        if (error) throw error;

        const transformedData = (data || []).map(transformPost);
        res.json(transformedData);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getPostById = async (req, res) => {
    try {
        const { id } = req.params;

        // Ensure id is an integer
        const numericId = parseInt(id);
        if (isNaN(numericId)) {
            return res.status(400).json({ error: 'Invalid post ID format. Expected an integer.' });
        }

        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                users (
                    name,
                    avatar,
                    verified
                ),
                post_likes (
                    user_id
                ),
                comments (
                    id,
                    author_id,
                    content,
                    time,
                    moderation_status,
                    users (
                        name,
                        avatar
                    )
                )
            `)
            .eq('id', numericId)
            .eq('moderation_status', 'approved')
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Post not found' });

        res.json(transformPost(data));
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: error.message });
    }
};

export const createPost = async (req, res) => {
    try {
        const { authorId, content, category, neighborhoodId } = req.body;
        let { image } = req.body;

        if (!authorId || !content) {
            return res.status(400).json({ error: 'authorId and content are required' });
        }

        // If a file was uploaded, use its path as the image URL
        if (req.file) {
            const protocol = req.protocol;
            const host = req.get('host');
            image = `${protocol}://${host}/uploads/${req.file.filename}`;
        }

        const { data, error } = await supabase
            .from('posts')
            .insert([{
                author_id: authorId.toString(),
                content,
                category,
                image,
                neighborhod_id: neighborhoodId ? parseInt(neighborhoodId) : null,
                likes: 0,
                moderation_status: 'approved'
            }])
            .select(`
                *,
                users (
                    name,
                    avatar,
                    verified
                )
            `)
            .single();

        if (error) throw error;
        
        // Background Fraud Check
        postFraudService.check({
            id: data.id,
            content: data.content
        }).catch(err => console.error('Post fraud check error:', err));

        res.status(201).json(transformPost(data));
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: error.message });
    }
};

export const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, category, image, authorId } = req.body;

        const numericId = parseInt(id);
        if (isNaN(numericId)) {
            return res.status(400).json({ error: 'Invalid post ID' });
        }

        // Verify ownership
        const { data: existingPost } = await supabase
            .from('posts')
            .select('author_id')
            .eq('id', numericId)
            .single();

        if (!existingPost) return res.status(404).json({ error: 'Post not found' });
        if (existingPost.author_id?.toString() !== authorId?.toString()) {
            return res.status(403).json({ error: 'Unauthorized to edit this post' });
        }

        const { data, error } = await supabase
            .from('posts')
            .update({
                content,
                category,
                image
            })
            .eq('id', numericId)
            .select(`
                *,
                users (
                    name,
                    avatar,
                    verified
                )
            `)
            .single();

        if (error) throw error;

        res.json(transformPost(data));
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: error.message });
    }
};

export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { authorId } = req.query;

        const numericId = parseInt(id);
        if (isNaN(numericId)) {
            return res.status(400).json({ error: 'Invalid post ID' });
        }

        // Verify ownership
        const { data: existingPost } = await supabase
            .from('posts')
            .select('author_id')
            .eq('id', numericId)
            .single();

        if (!existingPost) return res.status(404).json({ error: 'Post not found' });
        if (existingPost.author_id?.toString() !== authorId?.toString()) {
            return res.status(403).json({ error: 'Unauthorized to delete this post' });
        }

        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', numericId);

        if (error) throw error;

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: error.message });
    }
};

export const addComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { authorId, content } = req.body;

        if (!authorId || !content) {
            return res.status(400).json({ error: 'authorId and content are required' });
        }

        const pId = parseInt(postId);
        const aId = parseInt(authorId);

        if (isNaN(pId) || isNaN(aId)) {
            console.error('Invalid ID in addComment:', { postId, authorId });
            return res.status(400).json({ error: 'Invalid post or author ID' });
        }

        const { data, error } = await supabase
            .from('comments')
            .insert([{
                post_id: pId,
                author_id: aId,
                content,
                time: new Date().toISOString(),
                moderation_status: 'approved'
            }])
            .select(`
                *,
                users (
                    name,
                    avatar
                )
            `)
            .single();

        if (error) throw error;

        // Background Fraud Check
        commentFraudService.check({
            id: data.id,
            content: data.content
        }).catch(err => console.error('Comment fraud check error:', err));

        res.status(201).json({
            id: data.id.toString(),
            postId: data.post_id.toString(),
            authorId: data.author_id?.toString(),
            author: data.users?.name || 'Unknown User',
            avatar: data.users?.avatar || (data.users?.name ? data.users.name.charAt(0) : 'U'),
            content: data.content,
            time: new Date(data.time).toLocaleString()
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: error.message });
    }
};
export const toggleLike = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { userId } = req.body;

        const pId = parseInt(postId);
        const uId = parseInt(userId);

        if (isNaN(pId) || isNaN(uId)) {
            console.error('Invalid ID in toggleLike:', { postId, userId });
            return res.status(400).json({ error: 'Invalid post or user ID' });
        }

        // Check if like exists
        const { data: existingLike, error: fetchError } = await supabase
            .from('post_likes')
            .select('*')
            .eq('post_id', pId)
            .eq('user_id', uId)
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (existingLike) {
            // Unlike: Remove from post_likes
            const { error: deleteError } = await supabase
                .from('post_likes')
                .delete()
                .eq('post_id', pId)
                .eq('user_id', uId);

            if (deleteError) throw deleteError;

            // Decrement likes count in posts table
            const { error: updateError } = await supabase.rpc('decrement_likes', { post_id_val: pId });
            
            // If RPC fails (e.g. not defined), fallback to manual update
            if (updateError) {
                const { data: postData } = await supabase.from('posts').select('likes').eq('id', pId).single();
                await supabase.from('posts').update({ likes: Math.max(0, (postData?.likes || 0) - 1) }).eq('id', pId);
            }

            return res.json({ liked: false });
        } else {
            // Like: Add to post_likes
            const { error: insertError } = await supabase
                .from('post_likes')
                .insert([{
                    post_id: pId,
                    user_id: uId
                }]);

            if (insertError) throw insertError;

            // Increment likes count in posts table
            const { error: updateError } = await supabase.rpc('increment_likes', { post_id_val: pId });

            if (updateError) {
                const { data: postData } = await supabase.from('posts').select('likes').eq('id', pId).single();
                await supabase.from('posts').update({ likes: (postData?.likes || 0) + 1 }).eq('id', pId);
            }

            return res.json({ liked: true });
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getPostsCount = async (req, res) => {
    try {
        const { userId, neighborhoodId } = req.query;

        if (!userId || !neighborhoodId) {
            return res.status(400).json({ error: 'userId and neighborhoodId are required' });
        }

        const { count, error } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', userId.toString())
            .eq('neighborhod_id', parseInt(neighborhoodId));

        if (error) throw error;

        res.json({ count: count || 0 });
    } catch (error) {
        console.error('Error fetching posts count:', error);
        res.status(500).json({ error: error.message });
    }
};

