import express from "express";
import {
  getQueue,
  takeAction
} from "../controllers/moderationController.js";

const router = express.Router();

router.get("/moderation/queue", getQueue);
router.post("/moderation/action", takeAction);

export default router;