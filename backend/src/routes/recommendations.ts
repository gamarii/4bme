import { Router } from "express";
import { db } from "../firebaseAdmin.js";
import { recommendEngineers } from "../services/recommendationEngine.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const recommendations = await recommendEngineers(db, req.body);

    res.json({
      recommended: recommendations[0] ?? null,
      alternatives: recommendations.slice(1),
      all: recommendations,
    });
  } catch (err: any) {
    res.status(500).json({
      message: err.message || "Failed to generate recommendations",
    });
  }
});

export default router;