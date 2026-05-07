import express from 'express';
import {
  users,
  posts,
  marketplaceItems,
  services,
  events,
  alerts,
  conversations,
  messages,
  notifications,
  reviews,
  neighborhoods,
  neighborhoodProposals,
  serviceRequests,
  analyticsData,
  currentUser,
  currentLocation,
} from '../mockData.js';

const router = express.Router();

const findById = (collection, id) => collection.find((item) => item.id === id);

router.get('/current-user', (req, res) => {
  res.json(currentUser);
});

router.get('/analytics', (req, res) => {
  res.json(analyticsData);
});

router.get('/location', (req, res) => {
  res.json(currentLocation);
});

router.get('/users', (req, res) => {
  res.json(users);
});

router.get('/users/:id', (req, res) => {
  const user = findById(users, req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

router.get('/posts', (req, res) => {
  res.json(posts);
});

router.get('/posts/:id', (req, res) => {
  const post = findById(posts, req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json(post);
});


router.get('/services', (req, res) => {
  res.json(services);
});

router.get('/services/:id', (req, res) => {
  const service = findById(services, req.params.id);
  if (!service) return res.status(404).json({ message: 'Service not found' });
  res.json(service);
});


router.get('/alerts', (req, res) => {
  res.json(alerts);
});

router.get('/conversations', (req, res) => {
  res.json(conversations);
});

router.get('/conversations/:conversationId/messages', (req, res) => {
  res.json(messages[req.params.conversationId] || []);
});

router.get('/notifications', (req, res) => {
  res.json(notifications);
});

router.get('/reviews', (req, res) => {
  const targetId = req.query.targetId;
  if (targetId) {
    return res.json(reviews.filter((review) => review.targetId === targetId));
  }
  res.json(reviews);
});

router.get('/neighborhoods', (req, res) => {
  res.json(neighborhoods);
});

router.get('/neighborhoods/current', (req, res) => {
  const currentNeighborhood = neighborhoods.find((n) => n.verified) || neighborhoods[0];
  res.json(currentNeighborhood);
});

router.get('/neighborhoods/:id', (req, res) => {
  const neighborhood = findById(neighborhoods, req.params.id);
  if (!neighborhood) return res.status(404).json({ message: 'Neighborhood not found' });
  res.json(neighborhood);
});

router.get('/proposals', (req, res) => {
  res.json(neighborhoodProposals);
});

router.get('/proposals/:id', (req, res) => {
  const proposal = findById(neighborhoodProposals, req.params.id);
  if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
  res.json(proposal);
});

router.get('/service-requests', (req, res) => {
  res.json(serviceRequests);
});

export default router;
