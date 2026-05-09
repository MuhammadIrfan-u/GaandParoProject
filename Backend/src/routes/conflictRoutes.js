import express from "express";
import { createCase } from "../controllers/conflictController.js";

const router = express.Router();

router.post("/case", createCase);

export default router;