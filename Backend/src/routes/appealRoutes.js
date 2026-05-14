import express from "express";
import { createAppeal } from "../controllers/appealController.js";

const router = express.Router();

router.post("/appeal", createAppeal);

export default router