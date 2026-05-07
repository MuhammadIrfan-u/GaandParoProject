import express from 'express';
import {
    getPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    addComment
} from '../controllers/postController.js';

const router = express.Router();

router.get('/posts', getPosts);
router.get('/posts/:id', getPostById);
router.post('/posts', createPost);
router.post('/posts/:postId/comments', addComment);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);

export default router;
