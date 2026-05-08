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
        const { authorId, content, category, image, neighborhoodId } = req.body;

        if (!authorId || !content) {
            return res.status(400).json({ error: 'authorId and content are required' });
        }

        const { data, error } = await supabase
            .from('posts')
            .insert([{
                author_id: authorId.toString(),
                content,
                category,
                image,
                neighborhod_id: neighborhoodId ? parseInt(neighborhoodId) : null,
                likes: 0
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

        const { data, error } = await supabase
            .from('comments')
            .insert([{
                post_id: parseInt(postId),
                author_id: parseInt(authorId),
                content,
                time: new Date().toISOString()
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
