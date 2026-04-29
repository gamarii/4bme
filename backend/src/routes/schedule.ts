import { Router } from "express";
import { db } from "../firebaseAdmin.js";
import { recalculateSchedule } from "../services/scheduleEngine.js";

const router = Router();

router.post("/recalculate", (req, res) => {
  const result = recalculateSchedule(req.body);
  res.json(result);
});

router.get("/queue", async (_req, res) => {
  try {
    const snap = await db.collection("scheduleQueue").orderBy("start", "asc").get();

    const rows = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(rows);
  } catch (err: any) {
    res.status(500).json({
      message: err.message || "Failed to load schedule queue",
    });
  }
});

router.post("/confirm", async (req, res) => {
  try {
    const { updatedSchedule, supervisorId } = req.body as {
      updatedSchedule: Array<Record<string, unknown>>;
      supervisorId?: string;
    };

    if (!Array.isArray(updatedSchedule)) {
      return res.status(400).json({
        message: "updatedSchedule is required",
      });
    }

    const existing = await db.collection("scheduleQueue").get();
    const batch = db.batch();

    existing.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    updatedSchedule.forEach((task) => {
      const taskId =
        typeof task.id === "string" && task.id.trim() !== ""
          ? task.id
          : `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const ref = db.collection("scheduleQueue").doc(taskId);

      batch.set(ref, {
        ...task,
        updatedAt: new Date(),
      });
    });

    const auditRef = db.collection("auditLogs").doc();
    batch.set(auditRef, {
      taskId: "schedule_queue",
      action: "schedule_confirmed",
      supervisorId: supervisorId ?? null,
      reason: "Confirmed urgent schedule change",
      timestamp: new Date(),
    });

    await batch.commit();

    const refreshed = await db.collection("scheduleQueue").orderBy("start", "asc").get();

    const rows = refreshed.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({
      success: true,
      updatedSchedule: rows,
    });
  } catch (err: any) {
    res.status(500).json({
      message: err.message || "Failed to confirm schedule queue",
    });
  }
});

export default router;