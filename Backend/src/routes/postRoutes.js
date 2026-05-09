import express from 'express';
import multer from 'multer';
import path from 'path';
import {
    getPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    addComment,
    toggleLike
} from '../controllers/postController.js';

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const time = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `post_${time}${ext}`);
    }
});

const upload = multer({ storage });

router.get('/posts', getPosts);
router.get('/posts/:id', getPostById);
router.post('/posts', upload.single('image'), createPost);
router.post('/posts/:postId/comments', addComment);
router.post('/posts/:id/like', toggleLike);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);

export default router;
